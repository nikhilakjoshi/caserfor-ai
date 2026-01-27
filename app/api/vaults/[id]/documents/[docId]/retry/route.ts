import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// POST /api/vaults/[id]/documents/[docId]/retry - Retry failed document processing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: vaultId, docId } = await params

    const document = await prisma.document.findUnique({
      where: { id: docId },
    })

    if (!document || document.vaultId !== vaultId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (document.embeddingStatus !== "failed") {
      return NextResponse.json(
        { error: "Only failed documents can be retried" },
        { status: 400 }
      )
    }

    // Reset to pending
    const updated = await prisma.document.update({
      where: { id: docId },
      data: { embeddingStatus: "pending" },
    })

    // Trigger processing non-blocking
    const origin = request.nextUrl.origin
    fetch(`${origin}/api/vaults/${vaultId}/documents/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: docId }),
    }).catch((err) => {
      console.error("Failed to trigger reprocessing:", err)
    })

    return NextResponse.json({
      id: updated.id,
      embeddingStatus: updated.embeddingStatus,
    })
  } catch (error) {
    console.error("Failed to retry document:", error)
    return NextResponse.json({ error: "Failed to retry" }, { status: 500 })
  }
}
