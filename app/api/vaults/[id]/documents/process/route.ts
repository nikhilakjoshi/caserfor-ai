import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { extractText } from "@/lib/document-parser"
import { chunkText } from "@/lib/chunker"
import { embedChunks } from "@/lib/embeddings"
import { upsertVectors, vaultNamespace } from "@/lib/pinecone"
import type { VectorMetadata } from "@/lib/pinecone"

// POST /api/vaults/[id]/documents/process - Process document for embedding
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vaultId } = await params
    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId required" },
        { status: 400 }
      )
    }

    // Fetch document with metadata (contains base64 content)
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document || document.vaultId !== vaultId) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Set status to processing
    await prisma.document.update({
      where: { id: documentId },
      data: { embeddingStatus: "processing" },
    })

    try {
      // Extract base64 content from metadata
      const metadata = document.metadata as Record<string, unknown>
      const base64Content = metadata.content as string | undefined

      if (!base64Content) {
        throw new Error("No file content found in document metadata")
      }

      const buffer = Buffer.from(base64Content, "base64")

      // Extract text
      const text = await extractText(buffer, document.fileType)

      if (!text || text.trim().length === 0) {
        throw new Error("No text could be extracted from document")
      }

      // Chunk text
      const chunks = chunkText(text)

      // Embed chunks
      const chunkTexts = chunks.map((c) => c.text)
      const vectors = await embedChunks(chunkTexts)

      // Prepare pinecone records
      const namespace = vaultNamespace(vaultId)
      const records = chunks.map((chunk, i) => ({
        id: `${documentId}-chunk-${chunk.chunkIndex}`,
        values: vectors[i],
        metadata: {
          documentId,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          documentName: document.name,
          documentType: document.documentType || "unknown",
        } as VectorMetadata,
      }))

      // Upsert to Pinecone
      await upsertVectors(namespace, records)

      // Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: {
          embeddingStatus: "completed",
          chunkCount: chunks.length,
          embeddedAt: new Date(),
        },
      })

      return NextResponse.json({
        status: "completed",
        chunkCount: chunks.length,
      })
    } catch (processingError) {
      console.error("Document processing failed:", processingError)

      // Mark as failed
      await prisma.document.update({
        where: { id: documentId },
        data: { embeddingStatus: "failed" },
      })

      return NextResponse.json(
        { error: "Processing failed", detail: String(processingError) },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Process endpoint error:", error)
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    )
  }
}
