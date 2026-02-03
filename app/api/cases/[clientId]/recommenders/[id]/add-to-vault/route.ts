import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"
import { uploadFile } from "@/lib/s3"
import { htmlToPdfBuffer } from "@/lib/pdf-generator"
import { randomUUID } from "crypto"

type Params = { params: Promise<{ clientId: string; id: string }> }

/**
 * POST /api/cases/[clientId]/recommenders/[id]/add-to-vault
 * Converts the recommendation letter draft to PDF, uploads to S3,
 * creates a VaultDocument, and triggers processing.
 */
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { clientId, id: recommenderId } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    // Verify recommender belongs to client
    const recommender = await prisma.recommender.findFirst({
      where: { id: recommenderId, clientId },
    })
    if (!recommender) {
      return NextResponse.json({ error: "Recommender not found" }, { status: 404 })
    }

    // Find the recommendation letter draft for this recommender
    const draft = await prisma.caseDraft.findFirst({
      where: {
        clientId,
        documentType: "recommendation_letter",
        recommenderId,
      },
    })
    if (!draft || !draft.plainText) {
      return NextResponse.json(
        { error: "No draft content to export" },
        { status: 400 }
      )
    }

    // Get client's vault
    const client = result.client
    if (!client.vaultId) {
      return NextResponse.json(
        { error: "Client has no vault" },
        { status: 400 }
      )
    }

    // Convert HTML to PDF
    const pdfBuffer = await htmlToPdfBuffer(draft.plainText, `Recommendation Letter - ${recommender.name}`)

    // Upload to S3
    const fileUuid = randomUUID()
    const storageKey = `vaults/${client.vaultId}/${fileUuid}.pdf`
    await uploadFile(storageKey, pdfBuffer, "application/pdf")

    // Create Document record in vault
    const document = await prisma.document.create({
      data: {
        vaultId: client.vaultId,
        name: `Recommendation Letter - ${recommender.name}.pdf`,
        documentType: "recommendation_letter",
        fileType: "application/pdf",
        storageKey,
        sizeBytes: pdfBuffer.length,
        embeddingStatus: "pending",
        metadata: {
          recommenderId,
          recommenderName: recommender.name,
          generatedFrom: "rec-letter-workspace",
        },
      },
    })

    // Update recommender status to letter_finalized
    await prisma.recommender.update({
      where: { id: recommenderId },
      data: { status: "letter_finalized" },
    })

    // Trigger document processing (embedding pipeline) - fire and forget
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    fetch(`${baseUrl}/api/vaults/${client.vaultId}/documents/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: document.id }),
    }).catch((err) => {
      console.error("Failed to trigger document processing:", err)
    })

    return NextResponse.json({
      documentId: document.id,
      documentName: document.name,
      vaultId: client.vaultId,
    })
  } catch (error) {
    console.error("Error adding to vault:", error)
    return NextResponse.json(
      { error: "Failed to add to vault" },
      { status: 500 }
    )
  }
}
