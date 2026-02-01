import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"
import { runGapAnalysis } from "@/lib/gap-analysis"

export async function POST(
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

    if (user.role === "lawyer") {
      const assignment = await prisma.caseAssignment.findFirst({
        where: { lawyerId: user.id, clientId },
        select: { id: true },
      })
      if (!assignment) {
        return NextResponse.json({ error: "Not assigned to this case" }, { status: 403 })
      }
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, status: true },
    })
    if (!client || client.status === "draft") {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    // Run non-blocking
    runGapAnalysis(clientId)
      .then(async (result) => {
        await prisma.gapAnalysis.create({
          data: {
            clientId,
            overallStrength: result.overallStrength,
            summary: result.summary,
            criteria: JSON.parse(JSON.stringify(result.criteria)),
            priorityActions: JSON.parse(JSON.stringify(result.priorityActions)),
          },
        })
      })
      .catch((err) => {
        console.error("Gap analysis failed:", err)
      })

    return NextResponse.json({ status: "processing" }, { status: 202 })
  } catch (error) {
    console.error("Error triggering gap analysis:", error)
    return NextResponse.json({ error: "Failed to trigger gap analysis" }, { status: 500 })
  }
}
