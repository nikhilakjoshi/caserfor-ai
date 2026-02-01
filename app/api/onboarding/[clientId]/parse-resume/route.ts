import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"
import { downloadFile } from "@/lib/s3"
import { extractText } from "@/lib/document-parser"
import { parseResume } from "@/lib/resume-parser"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params

  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: user.id },
      select: { id: true, vaultId: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    if (!client.vaultId) {
      return NextResponse.json({ error: "Client has no vault" }, { status: 400 })
    }

    const { documentId } = await request.json()
    if (!documentId) {
      return NextResponse.json({ error: "documentId required" }, { status: 400 })
    }

    const document = await prisma.document.findFirst({
      where: { id: documentId, vaultId: client.vaultId },
      select: { id: true, storageKey: true, fileType: true },
    })

    if (!document || !document.storageKey) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const buffer = await downloadFile(document.storageKey)
    const text = await extractText(buffer, document.fileType || "txt")

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from document" }, { status: 422 })
    }

    const parsed = await parseResume(text)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("Failed to parse resume:", error)
    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 }
    )
  }
}
