import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { uploadFile } from "@/lib/s3"
import { randomUUID } from "crypto"
import { getUser } from "@/lib/get-user"
const MAX_FILE_SIZE = 25 * 1024 * 1024

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
      return NextResponse.json(
        { error: "Client has no vault" },
        { status: 400 }
      )
    }

    const vaultId = client.vaultId
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE)
    if (oversized.length > 0) {
      return NextResponse.json(
        { error: `Files exceed 25MB limit: ${oversized.map((f) => f.name).join(", ")}` },
        { status: 413 }
      )
    }

    const createdDocuments = []

    for (const file of files) {
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "unknown"
      const storageKey = `vaults/${vaultId}/${randomUUID()}.${fileExtension}`
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      await uploadFile(storageKey, buffer, file.type || "application/octet-stream")

      const document = await prisma.document.create({
        data: {
          vaultId,
          name: file.name,
          fileType: fileExtension,
          storageKey,
          sizeBytes: file.size,
          metadata: {
            originalName: file.name,
            mimeType: file.type,
          },
          embeddingStatus: "pending",
        },
      })

      createdDocuments.push(document)
    }

    // Trigger processing pipeline non-blocking
    const baseUrl = request.nextUrl.origin
    for (const doc of createdDocuments) {
      fetch(`${baseUrl}/api/vaults/${vaultId}/documents/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      }).catch((err) =>
        console.error(`Failed to trigger processing for ${doc.id}:`, err)
      )
    }

    return NextResponse.json(createdDocuments, { status: 201 })
  } catch (error) {
    console.error("Failed to upload documents:", error)
    return NextResponse.json(
      { error: "Failed to upload documents" },
      { status: 500 }
    )
  }
}
