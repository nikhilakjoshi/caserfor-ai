import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const agent = await prisma.agent.findFirst({
      where: { id, userId: user.id },
    })

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error("Failed to fetch agent:", error)
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { name, description, instruction } = body

    const existing = await prisma.agent.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    if (name !== undefined && (!name || typeof name !== "string" || !name.trim())) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    }

    if (instruction !== undefined && (!instruction || typeof instruction !== "string" || !instruction.trim())) {
      return NextResponse.json({ error: "Instruction cannot be empty" }, { status: 400 })
    }

    const data: Record<string, unknown> = {}

    if (name !== undefined) {
      data.name = name.trim()
      const newSlug = slugify(name)
      // Check slug uniqueness excluding self
      const slugConflict = await prisma.agent.findFirst({
        where: {
          userId: user.id,
          slug: newSlug,
          id: { not: id },
        },
      })
      data.slug = slugConflict ? `${newSlug}-${Date.now()}` : newSlug
    }

    if (description !== undefined) {
      data.description = description?.trim() || null
    }

    if (instruction !== undefined) {
      data.instruction = instruction.trim()
    }

    const agent = await prisma.agent.update({
      where: { id },
      data,
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error("Failed to update agent:", error)
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const existing = await prisma.agent.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    await prisma.agent.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete agent:", error)
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    )
  }
}
