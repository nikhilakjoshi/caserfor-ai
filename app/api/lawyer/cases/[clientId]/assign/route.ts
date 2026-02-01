import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export async function POST(
  _request: Request,
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

    // Verify client exists and is not a draft
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { status: true },
    })
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    if (client.status === "draft") {
      return NextResponse.json(
        { error: "Cannot assign draft intake" },
        { status: 400 }
      )
    }

    // Check if already assigned to this lawyer
    const existing = await prisma.caseAssignment.findUnique({
      where: { lawyerId_clientId: { lawyerId: user.id, clientId } },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Already assigned to this case" },
        { status: 409 }
      )
    }

    const assignment = await prisma.caseAssignment.create({
      data: { lawyerId: user.id, clientId },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error("Error assigning case:", error)
    return NextResponse.json(
      { error: "Failed to assign case" },
      { status: 500 }
    )
  }
}
