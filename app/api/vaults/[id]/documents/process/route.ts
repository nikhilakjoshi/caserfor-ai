import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { extractText } from "@/lib/document-parser"
import { chunkText } from "@/lib/chunker"
import { embedChunks } from "@/lib/embeddings"
import { upsertVectors, vaultNamespace } from "@/lib/pinecone"
import type { VectorMetadata } from "@/lib/pinecone"
import { categorizeDocument } from "@/lib/categorize-document"
import { downloadFile } from "@/lib/s3"
import { extractLinkedInProfile } from "@/lib/linkedin-parser"
import { runGapAnalysis } from "@/lib/gap-analysis"

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
      // Download file from S3
      if (!document.storageKey) {
        throw new Error("No storageKey found on document")
      }

      const buffer = await downloadFile(document.storageKey)

      // Extract text
      const text = await extractText(buffer, document.fileType)

      if (!text || text.trim().length === 0) {
        throw new Error("No text could be extracted from document")
      }

      // Run categorization and embedding in parallel
      const categorizePromise = categorizeDocument(document.name, text).catch(
        (err) => {
          console.error("Categorization failed (non-fatal):", err)
          return null
        }
      )

      // Chunk text
      const chunks = chunkText(text)

      // Embed chunks
      const chunkTexts = chunks.map((c) => c.text)
      const vectors = await embedChunks(chunkTexts)

      // Await categorization (started earlier)
      const categorization = await categorizePromise

      // If LinkedIn profile, extract recommenders in background (non-blocking)
      const resolvedCategory =
        categorization?.category || document.documentType
      if (resolvedCategory === "linkedin-profile") {
        runLinkedInExtraction(vaultId, text).catch((err) =>
          console.error("LinkedIn extraction failed (non-fatal):", err)
        )
      }

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

      // Build update data
      const existingMeta = (document.metadata as Record<string, unknown>) || {}
      const updateData: Record<string, unknown> = {
        embeddingStatus: "completed",
        chunkCount: chunks.length,
        embeddedAt: new Date(),
      }

      if (categorization) {
        // Only set documentType if not already user-assigned
        if (!document.documentType) {
          updateData.documentType = categorization.category
        }
        // Store AI categorization in metadata
        updateData.metadata = {
          ...existingMeta,
          aiCategory: categorization.category,
          aiCategoryConfidence: categorization.confidence,
          aiCategoryReasoning: categorization.reasoning,
        }
      }

      // Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: updateData,
      })

      // Auto-trigger gap analysis refresh (non-blocking, debounced)
      triggerGapAnalysisIfNeeded(vaultId).catch((err) =>
        console.error("Auto gap analysis trigger failed (non-fatal):", err)
      )

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

const GAP_ANALYSIS_DEBOUNCE_MS = 30_000 // 30 seconds

async function triggerGapAnalysisIfNeeded(vaultId: string) {
  // Resolve client from vault
  const vault = await prisma.vault.findUnique({
    where: { id: vaultId },
    include: { client: { select: { id: true, status: true } } },
  })
  if (!vault?.client || vault.client.status === "draft") return

  const clientId = vault.client.id

  // Debounce: skip if gap analysis was created recently
  const recent = await prisma.gapAnalysis.findFirst({
    where: {
      clientId,
      createdAt: { gte: new Date(Date.now() - GAP_ANALYSIS_DEBOUNCE_MS) },
    },
    select: { id: true },
  })
  if (recent) return

  const result = await runGapAnalysis(clientId)
  await prisma.gapAnalysis.create({
    data: {
      clientId,
      overallStrength: result.overallStrength,
      summary: result.summary,
      criteria: JSON.parse(JSON.stringify(result.criteria)),
      priorityActions: JSON.parse(JSON.stringify(result.priorityActions)),
    },
  })
}

async function runLinkedInExtraction(vaultId: string, text: string) {
  // Resolve clientId from Vault -> Client relation
  const vault = await prisma.vault.findUnique({
    where: { id: vaultId },
    include: { client: { select: { id: true } } },
  })
  if (!vault?.client) return

  const clientId = vault.client.id
  const result = await extractLinkedInProfile(text)

  // Create Recommender records from extracted potential recommenders
  for (const rec of result.potentialRecommenders) {
    await prisma.recommender.create({
      data: {
        clientId,
        name: rec.name,
        title: rec.title,
        organization: rec.organization,
        relationship: rec.relationship,
        notes: rec.reasoning,
        status: "suggested",
        sourceType: "linkedin_extract",
        aiReasoning: rec.reasoning,
      },
    })
  }
}
