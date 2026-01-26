import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

const MOCK_USER_ID = "mock-user-id"

// GET /api/documents - List documents with optional pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [documents, total] = await Promise.all([
      prisma.editorDocument.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          query: {
            select: {
              id: true,
              inputText: true,
              outputType: true,
            },
          },
        },
      }),
      prisma.editorDocument.count(),
    ])

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}

// POST /api/documents - Create a new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, queryId } = body

    if (!title || !queryId) {
      return NextResponse.json(
        { error: "title and queryId are required" },
        { status: 400 }
      )
    }

    // Verify the query exists and belongs to user
    const query = await prisma.assistantQuery.findFirst({
      where: {
        id: queryId,
        userId: MOCK_USER_ID,
      },
    })

    if (!query) {
      return NextResponse.json(
        { error: "Query not found" },
        { status: 404 }
      )
    }

    // Check if document already exists for this query
    const existingDoc = await prisma.editorDocument.findUnique({
      where: { queryId },
    })

    if (existingDoc) {
      return NextResponse.json(
        { error: "Document already exists for this query" },
        { status: 409 }
      )
    }

    const document = await prisma.editorDocument.create({
      data: {
        title,
        content: content || {},
        queryId,
        version: 1,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    )
  }
}
