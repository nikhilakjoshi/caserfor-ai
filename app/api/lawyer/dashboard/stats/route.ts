import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (user.role !== "lawyer" && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [activeCases, pendingReview, draftsInProgress, unassigned] =
      await Promise.all([
        // Active cases: assignments for this lawyer
        prisma.caseAssignment.count({
          where: { lawyerId: user.id },
        }),
        // Pending review: submitted clients assigned to lawyer
        prisma.client.count({
          where: {
            status: "submitted",
            caseAssignments: { some: { lawyerId: user.id } },
          },
        }),
        // Drafts in progress: drafts in draft/generating status for lawyer's cases
        prisma.caseDraft.count({
          where: {
            status: { in: ["draft", "generating"] },
            client: {
              caseAssignments: { some: { lawyerId: user.id } },
            },
          },
        }),
        // Unassigned: non-draft clients with no assignments
        prisma.client.count({
          where: {
            status: { not: "draft" },
            caseAssignments: { none: {} },
          },
        }),
      ])

    return NextResponse.json({
      activeCases,
      pendingReview,
      draftsInProgress,
      unassigned,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
