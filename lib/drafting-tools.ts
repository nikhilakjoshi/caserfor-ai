import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { queryRelevantChunks } from "@/lib/rag";

/**
 * Creates shared tool definitions for drafting agents.
 * Each agent receives tools scoped to a specific clientId.
 */
export function createDraftingTools(clientId: string) {
  return {
    get_client_profile: tool({
      description:
        "Retrieve the client's full intake profile including personal info, education, work history, achievements, and criterion responses",
      inputSchema: z.object({}),
      execute: async () => {
        const client = await prisma.client.findUniqueOrThrow({
          where: { id: clientId },
          include: { criterionResponses: true },
        });

        const criterionData: Record<string, unknown> = {};
        for (const cr of client.criterionResponses) {
          criterionData[cr.criterion] = cr.responses;
        }

        return JSON.stringify({
          personal: {
            name:
              `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim(),
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
            recommenderNotes: client.recommenderNotes,
            selfAssessment: client.selfAssessment,
            standingLevel: client.standingLevel,
            recognitionScope: client.recognitionScope,
          },
          immigration: {
            currentStatus: client.currentImmigrationStatus,
            desiredStatus: client.desiredStatus,
            previousApplications: client.previousApplications,
            specialCircumstances: client.specialCircumstances,
          },
          criterionResponses: criterionData,
          evidenceChecklist: client.evidenceChecklist,
        });
      },
    }),

    search_vault: tool({
      description:
        "Search the client's vault documents for relevant content using semantic search. Use to find evidence, facts, or context from uploaded files.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Search query to find relevant content in vault documents"),
      }),
      execute: async ({ query }) => {
        const client = await prisma.client.findUniqueOrThrow({
          where: { id: clientId },
          select: {
            vaultId: true,
            vault: { select: { documents: { select: { id: true } } } },
          },
        });

        const documentIds =
          client.vault?.documents.map((d) => d.id) ?? [];
        if (documentIds.length === 0) {
          return "No documents in client vault.";
        }

        const chunks = await queryRelevantChunks(query, documentIds, {
          topK: 5,
          vaultId: client.vaultId ?? undefined,
        });

        if (chunks.length === 0) {
          return "No relevant content found in vault documents.";
        }

        return chunks
          .map(
            (c) =>
              `[${c.documentName}] (score: ${c.score.toFixed(2)})\n${c.text}`,
          )
          .join("\n\n---\n\n");
      },
    }),

    get_gap_analysis: tool({
      description:
        "Retrieve the most recent gap analysis for the client, including strength assessment, criteria gaps, and priority actions",
      inputSchema: z.object({}),
      execute: async () => {
        const gap = await prisma.gapAnalysis.findFirst({
          where: { clientId },
          orderBy: { createdAt: "desc" },
        });

        if (!gap) {
          return "No gap analysis available for this client.";
        }

        return JSON.stringify({
          overallStrength: gap.overallStrength,
          summary: gap.summary,
          criteria: gap.criteria,
          priorityActions: gap.priorityActions,
        });
      },
    }),

    get_eligibility_report: tool({
      description:
        "Retrieve the EB-1A eligibility evaluation report including verdict, criterion scores, and evidence analysis",
      inputSchema: z.object({}),
      execute: async () => {
        const report = await prisma.eligibilityReport.findUnique({
          where: { clientId },
        });

        if (!report) {
          return "No eligibility report available for this client.";
        }

        return JSON.stringify({
          verdict: report.verdict,
          summary: report.summary,
          criteria: report.criteria,
        });
      },
    }),

    get_existing_drafts: tool({
      description:
        "List all existing drafts for this client with their type, title, status, and plain text content. Useful for cross-referencing other documents.",
      inputSchema: z.object({}),
      execute: async () => {
        const drafts = await prisma.caseDraft.findMany({
          where: { clientId },
          select: {
            id: true,
            documentType: true,
            title: true,
            status: true,
            plainText: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
        });

        if (drafts.length === 0) {
          return "No existing drafts for this client.";
        }

        return JSON.stringify(
          drafts.map((d) => ({
            id: d.id,
            documentType: d.documentType,
            title: d.title,
            status: d.status,
            plainText: d.plainText
              ? d.plainText.slice(0, 2000) + (d.plainText.length > 2000 ? "..." : "")
              : null,
            updatedAt: d.updatedAt.toISOString(),
          })),
        );
      },
    }),

    get_recommender: tool({
      description:
        "Retrieve full details for a specific recommender by ID, including their relationship to the client, qualifications, and any attached documents",
      inputSchema: z.object({
        recommenderId: z
          .string()
          .describe("The ID of the recommender to retrieve"),
      }),
      execute: async ({ recommenderId }) => {
        const rec = await prisma.recommender.findUnique({
          where: { id: recommenderId },
          include: {
            attachments: {
              select: {
                id: true,
                name: true,
                fileType: true,
                createdAt: true,
              },
            },
          },
        });

        if (!rec) {
          return `Recommender with ID ${recommenderId} not found.`;
        }

        if (rec.clientId !== clientId) {
          return "Recommender does not belong to this client.";
        }

        return JSON.stringify({
          id: rec.id,
          name: rec.name,
          title: rec.title,
          organization: rec.organization,
          relationship: rec.relationship,
          linkedinUrl: rec.linkedinUrl,
          email: rec.email,
          phone: rec.phone,
          notes: rec.notes,
          status: rec.status,
          sourceType: rec.sourceType,
          aiReasoning: rec.aiReasoning,
          criteriaRelevance: rec.criteriaRelevance,
          attachments: rec.attachments,
        });
      },
    }),
  };
}
