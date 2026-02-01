import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params

  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: user.id },
      select: { id: true, status: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const report = await prisma.eligibilityReport.findUnique({
      where: { clientId },
    })

    if (!report) {
      return NextResponse.json(
        { status: client.status, report: null },
        { status: 200 }
      )
    }

    return NextResponse.json({
      status: client.status,
      report,
    })
  } catch (error) {
    console.error("Failed to fetch report:", error)
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    )
  }
}
