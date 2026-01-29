import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const MOCK_USER_ID = "mock-user-id"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const query = await prisma.assistantQuery.findFirst({
      where: { id, userId: MOCK_USER_ID },
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
