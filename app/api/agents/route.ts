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

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const agents = await prisma.agent.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(agents)
  } catch (error) {
    console.error("Failed to fetch agents:", error)
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { name, description, instruction } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
      return NextResponse.json(
        { error: "Instruction is required" },
        { status: 400 }
      )
    }

    let slug = slugify(name)

    // Check slug uniqueness, append suffix if needed
    const existing = await prisma.agent.findUnique({
      where: { userId_slug: { userId: user.id, slug } },
    })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const agent = await prisma.agent.create({
      data: {
        userId: user.id,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        instruction: instruction.trim(),
      },
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error("Failed to create agent:", error)
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    )
  }
}
