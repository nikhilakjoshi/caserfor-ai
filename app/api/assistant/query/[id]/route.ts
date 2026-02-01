import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const query = await prisma.assistantQuery.findFirst({
      where: { id, userId: user.id },
      include: {
        sources: {
          select: {
            id: true,
            sourceType: true,
            sourceId: true,
            sourceName: true,
          },
        },
      },
    })

    if (!query) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: query.id,
      inputText: query.inputText,
      outputText: query.outputText,
      outputType: query.outputType,
      sources: query.sources,
      createdAt: query.createdAt.toISOString(),
    })
  } catch (error) {
    console.error("Failed to fetch query:", error)
    return NextResponse.json(
      { error: "Failed to fetch query" },
      { status: 500 }
    )
  }
}
