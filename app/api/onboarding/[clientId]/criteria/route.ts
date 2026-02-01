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
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const responses = await prisma.criterionResponse.findMany({
      where: { clientId },
      orderBy: { criterion: "asc" },
    })

    return NextResponse.json(responses)
  } catch (error) {
    console.error("Failed to fetch criteria:", error)
    return NextResponse.json(
      { error: "Failed to fetch criteria" },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const { criterion, responses } = await request.json()

    if (!criterion || responses === undefined) {
      return NextResponse.json(
        { error: "criterion and responses are required" },
        { status: 400 }
      )
    }

    const result = await prisma.criterionResponse.upsert({
      where: { clientId_criterion: { clientId, criterion } },
      create: { clientId, criterion, responses },
      update: { responses },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to upsert criterion:", error)
    return NextResponse.json(
      { error: "Failed to upsert criterion" },
      { status: 500 }
    )
  }
}
