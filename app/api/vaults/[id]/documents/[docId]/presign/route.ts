import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getPresignedUrl } from "@/lib/s3"

// GET /api/vaults/[id]/documents/[docId]/presign - Get presigned URL for download/preview
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: vaultId, docId } = await params

    const document = await prisma.document.findUnique({
      where: { id: docId },
      select: { id: true, vaultId: true, storageKey: true, name: true },
    })

    if (!document || document.vaultId !== vaultId) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    if (!document.storageKey) {
      return NextResponse.json(
        { error: "No storage key for document" },
        { status: 404 }
      )
    }

    const url = await getPresignedUrl(document.storageKey)

    return NextResponse.json({ url, name: document.name })
  } catch (error) {
    console.error("Failed to generate presigned URL:", error)
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    )
  }
}
