import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// GET /api/documents/[id] - Get a single document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const document = await prisma.editorDocument.findUnique({
      where: { id },
      include: {
        query: {
          select: {
            id: true,
            inputText: true,
            outputType: true,
            outputText: true,
            createdAt: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    )
  }
}

// PUT /api/documents/[id] - Update a document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, content } = body

    // Check document exists
    const existing = await prisma.editorDocument.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    const updateData: { title?: string; content?: object } = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content

    const document = await prisma.editorDocument.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    )
  }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check document exists
    const existing = await prisma.editorDocument.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    await prisma.editorDocument.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    )
  }
}
