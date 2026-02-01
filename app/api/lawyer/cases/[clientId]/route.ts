import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (user.role !== "lawyer" && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { clientId } = await params

    // Verify lawyer has access (assigned or admin)
    if (user.role === "lawyer") {
      const assignment = await prisma.caseAssignment.findFirst({
        where: { lawyerId: user.id, clientId },
        select: { id: true },
      })
      if (!assignment) {
        return NextResponse.json({ error: "Not assigned to this case" }, { status: 403 })
      }
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        eligibilityReport: true,
        criterionResponses: { select: { criterion: true } },
        vault: { select: { id: true, name: true } },
        caseAssignments: {
          select: {
            lawyerId: true,
            lawyer: { select: { name: true } },
          },
        },
      },
    })

    if (!client || client.status === "draft") {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      fieldOfExpertise: client.fieldOfExpertise,
      citizenship: client.citizenship,
      currentEmployer: client.currentEmployer,
      status: client.status,
      currentStep: client.currentStep,
      vault: client.vault,
      eligibilityReport: client.eligibilityReport,
      criteriaResponded: client.criterionResponses.map((c) => c.criterion),
      assignedTo: client.caseAssignments.map((a) => ({
        lawyerId: a.lawyerId,
        lawyerName: a.lawyer.name,
      })),
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    })
  } catch (error) {
    console.error("Error fetching case:", error)
    return NextResponse.json({ error: "Failed to fetch case" }, { status: 500 })
  }
}
