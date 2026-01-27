import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// PATCH /api/vaults/[id]/documents/[docId] - Update document fields (e.g. category override)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: vaultId, docId } = await params
    const body = await request.json()

    const document = await prisma.document.findUnique({
      where: { id: docId },
    })

    if (!document || document.vaultId !== vaultId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    const existingMeta = (document.metadata as Record<string, unknown>) || {}

    if (body.documentType !== undefined) {
      updateData.documentType = body.documentType
      // Preserve original AI category in metadata when user overrides
      if (existingMeta.aiCategory && !existingMeta.userOverrodeCategory) {
        updateData.metadata = {
          ...existingMeta,
          userOverrodeCategory: true,
        }
      }
    }

    if (body.name !== undefined) {
      updateData.name = body.name
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const updated = await prisma.document.update({
      where: { id: docId },
      data: updateData,
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      documentType: updated.documentType,
      fileType: updated.fileType,
      sizeBytes: updated.sizeBytes,
      embeddingStatus: updated.embeddingStatus,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Failed to update document:", error)
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}
