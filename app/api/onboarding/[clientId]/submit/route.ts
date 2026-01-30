import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const MOCK_USER_ID = "mock-user-id"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params

  try {
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: MOCK_USER_ID },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Validate required fields
    const missing: string[] = []
    if (!client.firstName) missing.push("firstName")
    if (!client.lastName) missing.push("lastName")
    if (!client.email) missing.push("email")
    if (!client.fieldOfExpertise) missing.push("fieldOfExpertise")

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      )
    }

    // Update status to submitted, then under_review
    await prisma.client.update({
      where: { id: clientId },
      data: { status: "submitted" },
    })

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: { status: "under_review" },
    })

    // Trigger EB1A evaluator non-blocking (when implemented)
    // const baseUrl = request.nextUrl.origin
    // fetch(`${baseUrl}/api/onboarding/${clientId}/evaluate`, { ... })

    return NextResponse.json(updated, { status: 202 })
  } catch (error) {
    console.error("Failed to submit intake:", error)
    return NextResponse.json(
      { error: "Failed to submit intake" },
      { status: 500 }
    )
  }
}
