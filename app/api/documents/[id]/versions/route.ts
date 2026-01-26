import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// GET /api/documents/[id]/versions - Get all versions of a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check document exists
    const document = await prisma.editorDocument.findUnique({
      where: { id },
      select: { id: true, currentVersion: true },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Get all versions
    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { version: "desc" },
      select: {
        id: true,
        version: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      documentId: id,
      currentVersion: document.currentVersion,
      versions,
    })
  } catch (error) {
    console.error("Error fetching document versions:", error)
    return NextResponse.json(
      { error: "Failed to fetch document versions" },
      { status: 500 }
    )
  }
}

// POST /api/documents/[id]/versions - Create a new version (AI regeneration)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    // Check document exists and get current version
    const document = await prisma.editorDocument.findUnique({
      where: { id },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    const newVersionNumber = document.currentVersion + 1

    // Create new version and update document in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Save current content as a version snapshot before overwriting
      // First check if current version was already saved
      const existingCurrentVersion = await tx.documentVersion.findUnique({
        where: {
          documentId_version: {
            documentId: id,
            version: document.currentVersion,
          },
        },
      })

      // If current version wasn't saved, save it first
      if (!existingCurrentVersion) {
        await tx.documentVersion.create({
          data: {
            documentId: id,
            version: document.currentVersion,
            content: document.content as object,
          },
        })
      }

      // Create the new version
      const newVersion = await tx.documentVersion.create({
        data: {
          documentId: id,
          version: newVersionNumber,
          content,
        },
      })

      // Update document with new content and version number
      const updatedDocument = await tx.editorDocument.update({
        where: { id },
        data: {
          content,
          currentVersion: newVersionNumber,
        },
      })

      return { document: updatedDocument, version: newVersion }
    })

    return NextResponse.json({
      document: result.document,
      version: result.version,
    })
  } catch (error) {
    console.error("Error creating document version:", error)
    return NextResponse.json(
      { error: "Failed to create document version" },
      { status: 500 }
    )
  }
}
