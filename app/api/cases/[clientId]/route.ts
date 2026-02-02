import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

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
