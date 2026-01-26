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
        versions: {
          select: {
            version: true,
            createdAt: true,
          },
          orderBy: { version: "desc" },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Build versions array including current version
    const versionNumbers = document.versions.map((v) => v.version)
    if (!versionNumbers.includes(document.currentVersion)) {
      versionNumbers.unshift(document.currentVersion)
    }
    versionNumbers.sort((a, b) => b - a) // Descending

    return NextResponse.json({
      ...document,
      availableVersions: versionNumbers,
    })
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
      include: {
        versions: {
          where: { version: 1 },
          select: { id: true },
        },
      },
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

    // If this is the first update and we're updating content, save version 1
    // This ensures we have a snapshot of version 1 before any AI regenerations
    if (content !== undefined && existing.versions.length === 0 && existing.currentVersion === 1) {
      await prisma.documentVersion.create({
        data: {
          documentId: id,
          version: 1,
          content: existing.content as object, // Save the original content as v1
        },
      })
    }

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
