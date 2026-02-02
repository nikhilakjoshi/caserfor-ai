import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { uploadFile } from "@/lib/s3"
import { getUser } from "@/lib/get-user"
import { scrapeLinkedInProfile } from "@/lib/brightdata"
import { parseLinkedInProfile, linkedInProfileToText } from "@/lib/linkedin-parser"
import { randomUUID } from "crypto"

const LINKEDIN_URL_RE = /linkedin\.com\/in\//i

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params

  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { url } = await request.json()
    if (!url || !LINKEDIN_URL_RE.test(url)) {
      return NextResponse.json({ error: "Invalid LinkedIn URL" }, { status: 400 })
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: user.id },
      select: { id: true, vaultId: true },
    })
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })
    if (!client.vaultId) return NextResponse.json({ error: "Client has no vault" }, { status: 400 })

    const vaultId = client.vaultId

    // Scrape LinkedIn profile
    const profileData = await scrapeLinkedInProfile(url)

    // Convert to text for vault storage
    const profileText = linkedInProfileToText(profileData)
    const textBuffer = Buffer.from(profileText, "utf-8")
    const storageKey = `vaults/${vaultId}/${randomUUID()}.txt`

    await uploadFile(storageKey, textBuffer, "text/plain")

    // Upsert document (overwrite previous LinkedIn import)
    const existing = await prisma.document.findFirst({
      where: { vaultId, name: "LinkedIn Profile" },
    })

    let document
    if (existing) {
      document = await prisma.document.update({
        where: { id: existing.id },
        data: {
          storageKey,
          sizeBytes: textBuffer.length,
          embeddingStatus: "pending",
          metadata: { source: "linkedin", url },
        },
      })
    } else {
      document = await prisma.document.create({
        data: {
          vaultId,
          name: "LinkedIn Profile",
          fileType: "txt",
          storageKey,
          sizeBytes: textBuffer.length,
          metadata: { source: "linkedin", url },
          embeddingStatus: "pending",
        },
      })
    }

    // Trigger embedding pipeline (fire-and-forget)
    const baseUrl = request.nextUrl.origin
    fetch(`${baseUrl}/api/vaults/${vaultId}/documents/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: document.id }),
    }).catch((err) =>
      console.error(`Failed to trigger processing for ${document.id}:`, err)
    )

    // Parse profile into structured fields
    const parsed = parseLinkedInProfile(profileData)

    return NextResponse.json({ document, parsed })
  } catch (error) {
    console.error("LinkedIn import failed:", error)
    const message =
      error instanceof Error ? error.message : "LinkedIn import failed"
    const status = message.includes("timed out") ? 504 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
