import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/db"

/**
 * Creates tool definitions for the lawyer dashboard assistant.
 * Tools are scoped to a specific lawyer (userId).
 */
export function createDashboardTools(lawyerId: string) {
  return {
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
