import { generateText, tool, stepCountIs, Output } from "ai"
import { z } from "zod"
import { analysisModel } from "@/lib/ai"
import { prisma } from "@/lib/db"
import { queryRelevantChunks } from "@/lib/rag"

const suggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      roleType: z.string().describe("Type of recommender role, e.g. 'PhD Advisor', 'Industry Collaborator', 'Journal Editor'"),
      reasoning: z.string().describe("Why this type of recommender strengthens the petition"),
      criteriaRelevance: z.array(z.string()).describe("Which EB-1A criteria this recommender type addresses"),
      idealQualifications: z.string().describe("What qualifications the ideal person in this role would have"),
      sampleTalkingPoints: z.array(z.string()).describe("Key points this recommender could address in their letter"),
    })
  ).min(5).max(8),
})

const SYSTEM_PROMPT = `You are an expert U.S. immigration attorney specializing in EB-1A extraordinary ability petitions. Your task is to suggest 5-8 ideal recommender role types for this client's petition.

## Context
Strong EB-1A petitions include recommendation letters from people who can independently verify the petitioner's extraordinary ability. The best petitions include a mix of:
- Direct supervisors/mentors who can speak to the petitioner's work
- Independent experts who know the petitioner's reputation in the field
- Collaborators who can attest to specific contributions
- People in positions of authority in the field (editors, committee chairs, etc.)

## Instructions
1. Use get_client_profile to understand the client's background, field, and achievements
2. Use get_gap_analysis and get_eligibility_report to understand which criteria are strong vs weak
3. Use search_vault to find specific evidence that recommenders could reference
4. Suggest 5-8 recommender ROLE TYPES (not specific people) that would best strengthen this petition
5. Focus on roles that address the client's weakest criteria or reinforce the strongest ones
6. Each suggestion should include specific talking points the recommender could address`

/**
 * Runs the recommender suggestion agent for a client.
 * Phase 1: Agentic tool-use loop to research client profile and evidence.
 * Phase 2: Structured output to produce recommender role suggestions.
 * Saves results as Recommender records with status=suggested, sourceType=ai_suggested.
 */
export async function suggestRecommenders(clientId: string): Promise<void> {
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
    get_client_profile: tool({
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
            recommenders: client.recommenderNotes,
            selfAssessment: client.selfAssessment,
            standingLevel: client.standingLevel,
            recognitionScope: client.recognitionScope,
          },
          criterionResponses: criterionData,
          evidenceChecklist: client.evidenceChecklist,
        })
      },
    }),
    search_vault: tool({
      description: "Search the client's uploaded documents for evidence related to a specific query",
      inputSchema: z.object({
        query: z.string().describe("Search query to find relevant evidence"),
      }),
      execute: async ({ query }) => {
        if (documentIds.length === 0) {
          return "No documents in client vault."
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
    get_gap_analysis: tool({
      description: "Get the latest gap analysis showing criteria strengths, gaps, and recommendations",
      inputSchema: z.object({}),
      execute: async () => {
        const gap = await prisma.gapAnalysis.findFirst({
          where: { clientId },
          orderBy: { createdAt: "desc" },
        })
        if (!gap) return "No gap analysis available."
        return JSON.stringify({
          overallStrength: gap.overallStrength,
          summary: gap.summary,
          criteria: gap.criteria,
          priorityActions: gap.priorityActions,
        })
      },
    }),
    get_eligibility_report: tool({
      description: "Get the EB-1A eligibility evaluation report with per-criterion scores",
      inputSchema: z.object({}),
      execute: async () => {
        const report = await prisma.eligibilityReport.findUnique({
          where: { clientId },
        })
        if (!report) return "No eligibility report available."
        return JSON.stringify({
          verdict: report.verdict,
          summary: report.summary,
          criteria: report.criteria,
        })
      },
    }),
  }

  // Phase 1: Agentic loop - research client profile and evidence
  const research = await generateText({
    model: analysisModel,
    system: SYSTEM_PROMPT,
    tools,
    stopWhen: stepCountIs(25),
    prompt: `Analyze the case for client ${client.firstName ?? ""} ${client.lastName ?? ""} (field: ${client.fieldOfExpertise ?? "Not specified"}) and suggest 5-8 ideal recommender role types.

Please:
1. First call get_client_profile to review intake data
2. Call get_gap_analysis and get_eligibility_report to understand strengths/weaknesses
3. Search the vault for key evidence that recommenders could reference
4. Then provide your analysis of what recommender roles would be most impactful`,
  })

  // Phase 2: Structured output
  const { output: result } = await generateText({
    model: analysisModel,
    output: Output.object({ schema: suggestionSchema }),
    prompt: `Based on the following analysis, produce exactly 5-8 recommender role type suggestions in the required JSON format.

${research.text}`,
  })

  if (!result) {
    throw new Error("No structured output generated from recommender suggestion")
  }

  // Save each suggestion as a Recommender record
  for (const suggestion of result.suggestions) {
    await prisma.recommender.create({
      data: {
        clientId,
        name: suggestion.roleType,
        status: "suggested",
        sourceType: "ai_suggested",
        aiReasoning: suggestion.reasoning,
        criteriaRelevance: suggestion.criteriaRelevance,
        notes: `Ideal qualifications: ${suggestion.idealQualifications}\n\nSample talking points:\n${suggestion.sampleTalkingPoints.map((p) => `- ${p}`).join("\n")}`,
      },
    })
  }
}
