import { generateText, tool, stepCountIs } from "ai"
import { z } from "zod"
import { analysisModel } from "@/lib/ai"
import { prisma } from "@/lib/db"
import { queryRelevantChunks } from "@/lib/rag"
import type { EligibilityVerdict } from "@prisma/client"

const SYSTEM_PROMPT = `You are an expert U.S. immigration attorney specializing in EB-1A extraordinary ability petitions. Your task is to evaluate a client's eligibility based on USCIS standards.

## EB-1A Requirements
The petitioner must demonstrate extraordinary ability in sciences, arts, education, business, or athletics through sustained national or international acclaim. They must meet AT LEAST 3 of the 10 criteria below, OR demonstrate a one-time major achievement (e.g., Nobel Prize, Olympic medal).

## The 10 Criteria
1. Awards - Nationally/internationally recognized prizes for excellence
2. Membership - Membership in associations requiring outstanding achievement
3. Press - Published material in professional/major trade publications about the person
4. Judging - Participation as judge of others' work in the field
5. Original Contribution - Original contributions of major significance
6. Scholarly Articles - Authorship of scholarly articles in professional journals
7. Exhibitions - Display of work at artistic exhibitions
8. Leading Role - Leading/critical role in distinguished organizations
9. High Salary - High salary relative to others in the field
10. Commercial Success - Commercial successes in performing arts

## Evaluation Instructions
1. Use the get_intake_data tool to retrieve the client's intake form data and criterion-specific responses.
2. Use the search_evidence tool to search the client's uploaded documents for supporting evidence for each criterion.
3. For each criterion, assign a score from 1-5:
   - 1: No evidence or extremely weak
   - 2: Minimal evidence, unlikely to satisfy
   - 3: Some evidence, may satisfy with additional documentation
   - 4: Good evidence, likely satisfies criterion
   - 5: Strong evidence, clearly satisfies criterion
4. Determine overall verdict based on how many criteria score >= 3:
   - strong: 4+ criteria score >= 4
   - moderate: 3+ criteria score >= 3
   - weak: 1-2 criteria score >= 3
   - insufficient: 0 criteria score >= 3

## Output Format
After your analysis, output a JSON block wrapped in \`\`\`json ... \`\`\` with this structure:
{
  "verdict": "strong" | "moderate" | "weak" | "insufficient",
  "summary": "2-3 paragraph overall assessment",
  "criteria": [
    {
      "slug": "awards",
      "label": "Awards",
      "score": 1-5,
      "analysis": "1-2 paragraph analysis of this criterion",
      "evidence": ["list of specific evidence items found"]
    }
  ]
}
`

interface CriterionResult {
  slug: string
  label: string
  score: number
  analysis: string
  evidence: string[]
}

interface EvaluationResult {
  verdict: EligibilityVerdict
  summary: string
  criteria: CriterionResult[]
}

/**
 * Runs the EB-1A eligibility evaluation for a client.
 * Fetches intake data and searches uploaded documents via RAG,
 * then produces a structured eligibility report.
 */
export async function runEvaluation(clientId: string): Promise<void> {
  try {
    // Set status to under_review
    await prisma.client.update({
      where: { id: clientId },
      data: { status: "under_review" },
    })

    const client = await prisma.client.findUniqueOrThrow({
      where: { id: clientId },
      include: {
        criterionResponses: true,
        vault: { include: { documents: true } },
      },
    })

    const vaultId = client.vaultId
    const documentIds = client.vault?.documents.map((d) => d.id) ?? []

    // Build tools for the evaluator agent
    const tools = {
      get_intake_data: tool({
        description: "Retrieve the client's intake form data including personal info, achievements, and criterion-specific responses",
        inputSchema: z.object({}),
        execute: async () => {
          const criterionData: Record<string, unknown> = {}
          for (const cr of client.criterionResponses) {
            criterionData[cr.criterion] = cr.responses
          }
          return JSON.stringify({
            personal: {
              name: `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim(),
              email: client.email,
              citizenship: client.citizenship,
              fieldOfExpertise: client.fieldOfExpertise,
              currentEmployer: client.currentEmployer,
              education: client.education,
            },
            usIntent: {
              type: client.usIntentType,
              details: client.usIntentDetails,
            },
            achievement: {
              hasMajorAchievement: client.hasMajorAchievement,
              details: client.majorAchievementDetails,
            },
            impact: {
              socialFollowing: client.socialFollowing,
              keynotes: client.keynotes,
              recommenders: client.recommenders,
              selfAssessment: client.selfAssessment,
              standingLevel: client.standingLevel,
              recognitionScope: client.recognitionScope,
            },
            criterionResponses: criterionData,
            evidenceChecklist: client.evidenceChecklist,
            altCategories: client.altCategories,
          })
        },
      }),
      search_evidence: tool({
        description: "Search the client's uploaded documents for evidence related to a specific query. Use this to find supporting evidence for each EB-1A criterion.",
        inputSchema: z.object({
          query: z.string().describe("Search query to find relevant evidence in uploaded documents"),
        }),
        execute: async ({ query }) => {
          if (documentIds.length === 0) {
            return "No documents uploaded by client."
          }
          const chunks = await queryRelevantChunks(query, documentIds, {
            topK: 5,
            vaultId: vaultId ?? undefined,
          })
          if (chunks.length === 0) {
            return "No relevant evidence found in uploaded documents."
          }
          return chunks
            .map((c) => `[${c.documentName}] (score: ${c.score.toFixed(2)})\n${c.text}`)
            .join("\n\n---\n\n")
        },
      }),
    }

    const result = await generateText({
      model: analysisModel,
      system: SYSTEM_PROMPT,
      tools,
      stopWhen: stepCountIs(25),
      prompt: `Evaluate the EB-1A eligibility for client ${client.firstName ?? ""} ${client.lastName ?? ""}.
Field of expertise: ${client.fieldOfExpertise ?? "Not specified"}.
${client.hasMajorAchievement ? `They claim a major achievement: ${client.majorAchievementDetails}` : "No major one-time achievement claimed."}

Please:
1. First call get_intake_data to review all intake responses
2. For each of the 10 EB-1A criteria, search for relevant evidence using search_evidence
3. Score each criterion and provide your overall assessment
4. Output your final evaluation as a JSON block`,
    })

    // Parse the JSON from the response
    const jsonMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/)
    if (!jsonMatch) {
      throw new Error("No JSON output found in evaluator response")
    }

    const evaluation: EvaluationResult = JSON.parse(jsonMatch[1])

    // Validate verdict
    const validVerdicts: EligibilityVerdict[] = ["strong", "moderate", "weak", "insufficient"]
    if (!validVerdicts.includes(evaluation.verdict)) {
      evaluation.verdict = "insufficient"
    }

    // Save report
    await prisma.eligibilityReport.upsert({
      where: { clientId },
      create: {
        clientId,
        verdict: evaluation.verdict,
        summary: evaluation.summary,
        criteria: JSON.parse(JSON.stringify(evaluation.criteria)),
        rawOutput: result.text,
      },
      update: {
        verdict: evaluation.verdict,
        summary: evaluation.summary,
        criteria: JSON.parse(JSON.stringify(evaluation.criteria)),
        rawOutput: result.text,
      },
    })

    // Update client status
    await prisma.client.update({
      where: { id: clientId },
      data: { status: "reviewed" },
    })
  } catch (error) {
    console.error("EB1A evaluation failed:", error)
    // Reset status to submitted so user can retry
    try {
      await prisma.client.update({
        where: { id: clientId },
        data: { status: "submitted" },
      })
    } catch {
      // ignore secondary error
    }
    throw error
  }
}
