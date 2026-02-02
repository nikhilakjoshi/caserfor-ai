import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"
import { runEvaluation } from "@/lib/eb1a-evaluator"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params

  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: user.id },
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

    // Update status
    await prisma.client.update({
      where: { id: clientId },
      data: { status: "under_review" },
    })

    // Run evaluation after response is sent (keeps serverless alive)
    after(async () => {
      try {
        await runEvaluation(clientId)
      } catch (err) {
        console.error("Background evaluation failed:", err)
      }
    })

    return NextResponse.json({ id: clientId, status: "under_review" }, { status: 202 })
  } catch (error) {
    console.error("Failed to submit intake:", error)
    return NextResponse.json(
      { error: "Failed to submit intake" },
      { status: 500 }
    )
  }
}
