import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const MOCK_USER_ID = "mock-user-id"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params

  try {
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: MOCK_USER_ID },
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
