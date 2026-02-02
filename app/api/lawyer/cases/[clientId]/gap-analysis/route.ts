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

    const analysis = await prisma.gapAnalysis.findFirst({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    })

    if (!analysis) {
      return NextResponse.json({ error: "No gap analysis found" }, { status: 404 })
    }

    return NextResponse.json({
      id: analysis.id,
      overallStrength: analysis.overallStrength,
      summary: analysis.summary,
      criteria: analysis.criteria,
      priorityActions: analysis.priorityActions,
      createdAt: analysis.createdAt,
    })
  } catch (error) {
    console.error("Error fetching gap analysis:", error)
    return NextResponse.json({ error: "Failed to fetch gap analysis" }, { status: 500 })
  }
}
