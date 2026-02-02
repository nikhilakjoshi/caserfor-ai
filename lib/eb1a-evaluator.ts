import { generateText, tool, stepCountIs, Output } from "ai";
import { z } from "zod";
import { analysisModel } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { queryRelevantChunks } from "@/lib/rag";
import type { EligibilityVerdict } from "@prisma/client";

const criterionSchema = z.object({
  slug: z.string(),
  label: z.string(),
  score: z.number().min(1).max(5).describe("1=no evidence, 2=minimal, 3=some evidence, 4=good evidence, 5=strong evidence"),
  analysis: z.string().describe("1-2 paragraph analysis of this criterion"),
  evidence: z.array(z.string()).describe("Specific evidence items found"),
});

const evaluationSchema = z.object({
  verdict: z.enum(["strong", "moderate", "weak", "insufficient"]).describe(
    "strong: 4+ criteria score >= 4, moderate: 3+ criteria score >= 3, weak: 1-2 criteria score >= 3, insufficient: 0 criteria score >= 3"
  ),
  summary: z.string().describe("2-3 paragraph overall assessment"),
  criteria: z.array(criterionSchema).describe("All 10 EB-1A criteria evaluations"),
});

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
   - insufficient: 0 criteria score >= 3`;

/**
 * Runs the EB-1A eligibility evaluation for a client.
 * Phase 1: Agentic tool-use loop to gather intake data + search evidence.
 * Phase 2: Structured output call to produce the final evaluation.
 */
export async function runEvaluation(clientId: string): Promise<void> {
  try {
    const client = await prisma.client.findUniqueOrThrow({
      where: { id: clientId },
      include: {
        criterionResponses: true,
        vault: { include: { documents: true } },
      },
    });

    const vaultId = client.vaultId;
    const documentIds = client.vault?.documents.map((d) => d.id) ?? [];

    const tools = {
      get_intake_data: tool({
        description:
          "Retrieve the client's intake form data including personal info, achievements, and criterion-specific responses",
        inputSchema: z.object({}),
        execute: async () => {
          const criterionData: Record<string, unknown> = {};
          for (const cr of client.criterionResponses) {
            criterionData[cr.criterion] = cr.responses;
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
            altCategories: client.altCategories,
          });
        },
      }),
      search_evidence: tool({
        description:
          "Search the client's uploaded documents for evidence related to a specific query. Use this to find supporting evidence for each EB-1A criterion.",
        inputSchema: z.object({
          query: z
            .string()
            .describe(
              "Search query to find relevant evidence in uploaded documents",
            ),
        }),
        execute: async ({ query }) => {
          if (documentIds.length === 0) {
            return "No documents uploaded by client.";
          }
          const chunks = await queryRelevantChunks(query, documentIds, {
            topK: 5,
            vaultId: vaultId ?? undefined,
          });
          if (chunks.length === 0) {
            return "No relevant evidence found in uploaded documents.";
          }
          return chunks
            .map(
              (c) =>
                `[${c.documentName}] (score: ${c.score.toFixed(2)})\n${c.text}`,
            )
            .join("\n\n---\n\n");
        },
      }),
    };

    // Phase 1: Agentic loop -- gather evidence via tools
    const research = await generateText({
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
3. Score each criterion and provide your overall assessment`,
    });

    // Phase 2: Structured output from gathered context
    const { output: evaluation } = await generateText({
      model: analysisModel,
      output: Output.object({ schema: evaluationSchema }),
      prompt: `Based on the following EB-1A evaluation analysis, produce the final structured evaluation report.

${research.text}`,
    });

    if (!evaluation) {
      throw new Error("No structured output generated from evaluation");
    }

    // Save report
    await prisma.eligibilityReport.upsert({
      where: { clientId },
      create: {
        clientId,
        verdict: evaluation.verdict,
        summary: evaluation.summary,
        criteria: JSON.parse(JSON.stringify(evaluation.criteria)),
        rawOutput: research.text,
      },
      update: {
        verdict: evaluation.verdict,
        summary: evaluation.summary,
        criteria: JSON.parse(JSON.stringify(evaluation.criteria)),
        rawOutput: research.text,
      },
    });

    // Update client status
    await prisma.client.update({
      where: { id: clientId },
      data: { status: "reviewed" },
    });
  } catch (error) {
    console.error("EB1A evaluation failed:", error);
    // Reset status to submitted so user can retry
    try {
      await prisma.client.update({
        where: { id: clientId },
        data: { status: "submitted" },
      });
    } catch {
      // ignore secondary error
    }
    throw error;
  }
}
