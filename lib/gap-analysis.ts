import { generateText, tool, stepCountIs } from "ai"
import { z } from "zod"
import { defaultModel } from "@/lib/ai"
import { prisma } from "@/lib/db"
import { queryRelevantChunks } from "@/lib/rag"

const SYSTEM_PROMPT = `You are an expert U.S. immigration attorney specializing in EB-1A extraordinary ability petitions. Your task is to perform a GAP ANALYSIS - identifying what evidence is missing or weak for each criterion, and recommending specific actions to strengthen the case.

## The 10 EB-1A Criteria
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

## Instructions
1. Use get_intake_data to retrieve client intake data and criterion responses.
2. Use search_evidence to search uploaded documents for supporting evidence per criterion.
3. For each criterion, assess:
   - Current strength (1-5 scale)
   - What evidence exists
   - What evidence is MISSING or weak
   - Specific recommendations to strengthen it
4. Focus on actionable gaps - what documents/evidence the lawyer should gather.

## Output Format
Output a JSON block wrapped in \`\`\`json ... \`\`\` with this structure:
{
  "overallStrength": "strong" | "moderate" | "weak" | "insufficient",
  "summary": "1-2 paragraph gap analysis summary",
  "criteria": [
    {
      "slug": "awards",
      "label": "Awards",
      "strength": 1-5,
      "existingEvidence": ["list of evidence found"],
      "gaps": ["list of missing evidence or weaknesses"],
      "recommendations": ["specific actions to strengthen this criterion"]
    }
  ],
  "priorityActions": ["top 3-5 most impactful actions across all criteria"]
}
`

interface CriterionGap {
  slug: string
  label: string
  strength: number
  existingEvidence: string[]
  gaps: string[]
  recommendations: string[]
}

export interface GapAnalysisResult {
  overallStrength: string
  summary: string
  criteria: CriterionGap[]
  priorityActions: string[]
}

/**
 * Runs gap analysis for a client case.
 * Uses gemini-2.5-flash for speed (vs pro for full evaluation).
 */
export async function runGapAnalysis(clientId: string): Promise<GapAnalysisResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    include: {
      criterionResponses: true,
      vault: { include: { documents: true } },
    },
  })

  const vaultId = client.vaultId
  const documentIds = client.vault?.documents.map((d) => d.id) ?? []

  const tools = {
    get_intake_data: tool({
      description: "Retrieve the client's intake form data and criterion-specific responses",
      inputSchema: z.object({}),
      execute: async () => {
        const criterionData: Record<string, unknown> = {}
        for (const cr of client.criterionResponses) {
          criterionData[cr.criterion] = cr.responses
        }
        return JSON.stringify({
          personal: {
            name: `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim(),
            fieldOfExpertise: client.fieldOfExpertise,
            currentEmployer: client.currentEmployer,
            education: client.education,
          },
          achievement: {
            hasMajorAchievement: client.hasMajorAchievement,
            details: client.majorAchievementDetails,
          },
          criterionResponses: criterionData,
          evidenceChecklist: client.evidenceChecklist,
          documentCount: documentIds.length,
        })
      },
    }),
    search_evidence: tool({
      description: "Search uploaded documents for evidence related to a specific query",
      inputSchema: z.object({
        query: z.string().describe("Search query for evidence"),
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
          return "No relevant evidence found."
        }
        return chunks
          .map((c) => `[${c.documentName}] (score: ${c.score.toFixed(2)})\n${c.text}`)
          .join("\n\n---\n\n")
      },
    }),
  }

  const result = await generateText({
    model: defaultModel,
    system: SYSTEM_PROMPT,
    tools,
    stopWhen: stepCountIs(20),
    prompt: `Perform a gap analysis for client ${client.firstName ?? ""} ${client.lastName ?? ""}.
Field: ${client.fieldOfExpertise ?? "Not specified"}.
${documentIds.length} documents uploaded.

1. Call get_intake_data to review intake data
2. For each criterion, search for evidence and identify gaps
3. Provide actionable recommendations
4. Output your analysis as a JSON block`,
  })

  const jsonMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/)
  if (!jsonMatch) {
    throw new Error("No JSON output in gap analysis response")
  }

  return JSON.parse(jsonMatch[1]) as GapAnalysisResult
}
