import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const MOCK_USER_ID = "mock-user-id"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: MOCK_USER_ID },
      select: { paidAt: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({
      paid: !!client.paidAt,
      paidAt: client.paidAt,
    })
  } catch (error) {
    console.error("Payment status error:", error)
    return NextResponse.json({ error: "Failed to check payment status" }, { status: 500 })
  }
}
