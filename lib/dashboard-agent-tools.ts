import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { queryRelevantChunks } from "@/lib/rag"

/**
 * Creates tool definitions for the lawyer dashboard assistant.
 * Tools are scoped to a specific lawyer (userId).
 */
export function createDashboardTools(lawyerId: string) {
  return {
    get_case_detail: tool({
      description:
        "Retrieve full detail for a specific case by clientId. Returns client profile, eligibility report, criteria responses, recommenders, drafts, gap analyses, vault info, and assignments.",
      inputSchema: z.object({
        clientId: z.string().describe("The client ID to fetch details for"),
      }),
      execute: async ({ clientId }) => {
        // Verify lawyer has access
        const assignment = await prisma.caseAssignment.findFirst({
          where: { lawyerId, clientId },
          select: { id: true },
        })
        if (!assignment) {
          return "You are not assigned to this case."
        }

        const client = await prisma.client.findUnique({
          where: { id: clientId },
          include: {
            eligibilityReport: true,
            criterionResponses: {
              select: { criterion: true, responses: true, createdAt: true },
            },
            recommenders: {
              select: {
                id: true,
                name: true,
                email: true,
                relationship: true,
                organization: true,
                status: true,
              },
            },
            caseDrafts: {
              select: {
                id: true,
                documentType: true,
                status: true,
                updatedAt: true,
                recommenderId: true,
              },
            },
            gapAnalyses: {
              select: { id: true, overallStrength: true, createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            vault: {
              select: {
                id: true,
                name: true,
                documents: {
                  select: {
                    id: true,
                    name: true,
                    documentType: true,
                    createdAt: true,
                  },
                },
              },
            },
            caseAssignments: {
              select: {
                lawyerId: true,
                lawyer: { select: { name: true } },
              },
            },
          },
        })

        if (!client || client.status === "draft") {
          return "Case not found."
        }

        return JSON.stringify({
          id: client.id,
          name:
            `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() ||
            "Unnamed",
          email: client.email,
          phone: client.phone,
          citizenship: client.citizenship,
          fieldOfExpertise: client.fieldOfExpertise,
          currentEmployer: client.currentEmployer,
          education: client.education,
          status: client.status,
          currentStep: client.currentStep,
          eligibilityReport: client.eligibilityReport
            ? {
                verdict: client.eligibilityReport.verdict,
                summary: client.eligibilityReport.summary,
                createdAt: client.eligibilityReport.createdAt,
              }
            : null,
          criterionResponses: client.criterionResponses,
          recommenders: client.recommenders,
          drafts: client.caseDrafts,
          latestGapAnalysis: client.gapAnalyses[0] ?? null,
          vault: client.vault
            ? {
                id: client.vault.id,
                name: client.vault.name,
                documentCount: client.vault.documents.length,
                documents: client.vault.documents,
              }
            : null,
          assignedTo: client.caseAssignments.map((a) => ({
            lawyerId: a.lawyerId,
            lawyerName: a.lawyer.name,
          })),
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
        })
      },
    }),

    search_vault: tool({
      description:
        "Search a case's vault documents using semantic/RAG search. Returns relevant text chunks matching the query. Use to find specific evidence, documents, or information within a client's uploaded files.",
      inputSchema: z.object({
        clientId: z.string().describe("The client ID whose vault to search"),
        query: z
          .string()
          .describe("Natural language search query for vault content"),
        topK: z
          .number()
          .optional()
          .describe("Max results to return (default 10)"),
      }),
      execute: async ({ clientId, query, topK }) => {
        // Verify lawyer has access
        const assignment = await prisma.caseAssignment.findFirst({
          where: { lawyerId, clientId },
          select: { id: true },
        })
        if (!assignment) {
          return "You are not assigned to this case."
        }

        const client = await prisma.client.findUnique({
          where: { id: clientId },
          select: {
            vault: {
              select: {
                id: true,
                documents: { select: { id: true } },
              },
            },
          },
        })

        const vault = client?.vault
        if (!vault || vault.documents.length === 0) {
          return "No vault or documents found for this case."
        }

        const documentIds = vault.documents.map((d: { id: string }) => d.id)
        const chunks = await queryRelevantChunks(query, documentIds, {
          topK: topK ?? 10,
          vaultId: vault.id,
        })

        if (chunks.length === 0) {
          return "No relevant results found."
        }

        return JSON.stringify(
          chunks.map((c) => ({
            documentName: c.documentName,
            documentType: c.documentType,
            text: c.text,
            score: c.score,
          }))
        )
      },
    }),

    get_all_cases: tool({
      description:
        "Retrieve all cases assigned to the lawyer with summary fields including client name, status, visa type, verdict, and update timestamps. Use to answer questions about the lawyer's caseload.",
      inputSchema: z.object({}),
      execute: async () => {
        const assignments = await prisma.caseAssignment.findMany({
          where: { lawyerId },
          include: {
            client: {
              include: {
                eligibilityReport: { select: { verdict: true } },
                criterionResponses: { select: { id: true } },
                caseDrafts: {
                  select: { id: true, documentType: true, status: true },
                },
                vault: {
                  select: {
                    documents: { select: { id: true } },
                  },
                },
              },
            },
          },
        })

        if (assignments.length === 0) {
          return "No cases assigned to you."
        }

        const cases = assignments.map((a) => ({
          clientId: a.client.id,
          name:
            `${a.client.firstName ?? ""} ${a.client.lastName ?? ""}`.trim() ||
            "Unnamed",
          email: a.client.email,
          fieldOfExpertise: a.client.fieldOfExpertise,
          status: a.client.status,
          verdict: a.client.eligibilityReport?.verdict ?? null,
          criteriaCount: a.client.criterionResponses.length,
          draftCount: a.client.caseDrafts.length,
          documentCount: a.client.vault?.documents.length ?? 0,
          assignedAt: a.assignedAt.toISOString(),
          updatedAt: a.client.updatedAt.toISOString(),
        }))

        return JSON.stringify(cases)
      },
    }),
  }
}
