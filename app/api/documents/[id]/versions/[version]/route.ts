import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// GET /api/documents/[id]/versions/[version] - Get a specific version
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  try {
    const { id, version: versionStr } = await params
    const versionNum = parseInt(versionStr, 10)

    if (isNaN(versionNum)) {
      return NextResponse.json(
        { error: "Invalid version number" },
        { status: 400 }
      )
    }

    // Check document exists
    const document = await prisma.editorDocument.findUnique({
      where: { id },
      select: { id: true, currentVersion: true, content: true },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // If requesting current version, return document content directly
    if (versionNum === document.currentVersion) {
      return NextResponse.json({
        documentId: id,
        version: versionNum,
        content: document.content,
        isCurrent: true,
      })
    }

    // Otherwise, look up the version
    const versionRecord = await prisma.documentVersion.findUnique({
      where: {
        documentId_version: {
          documentId: id,
          version: versionNum,
        },
      },
    })

    if (!versionRecord) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      documentId: id,
      version: versionNum,
      content: versionRecord.content,
      isCurrent: false,
      createdAt: versionRecord.createdAt,
    })
  } catch (error) {
    console.error("Error fetching document version:", error)
    return NextResponse.json(
      { error: "Failed to fetch document version" },
      { status: 500 }
    )
  }
}
