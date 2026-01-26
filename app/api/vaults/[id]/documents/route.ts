import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { randomUUID } from "crypto"

// POST /api/vaults/[id]/documents - Upload documents to vault
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vaultId } = await params

    // Verify vault exists
    const vault = await prisma.vault.findUnique({
      where: { id: vaultId },
      select: { id: true },
    })

    if (!vault) {
      return NextResponse.json(
        { error: "Vault not found" },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const categoriesRaw = formData.get("categories") as string | null
    const tagsRaw = formData.get("tags") as string | null

    // Parse categories and tags JSON arrays
    // categories: { [filename]: category }
    // tags: { [filename]: string[] }
    const categories: Record<string, string> = categoriesRaw ? JSON.parse(categoriesRaw) : {}
    const tags: Record<string, string[]> = tagsRaw ? JSON.parse(tagsRaw) : {}

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      )
    }

    const createdDocuments = []

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const base64Content = Buffer.from(arrayBuffer).toString("base64")

      // Extract file extension
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "unknown"

      // Generate storage key (would be S3 key in production)
      const storageKey = `vaults/${vaultId}/${randomUUID()}.${fileExtension}`

      const document = await prisma.document.create({
        data: {
          vaultId,
          name: file.name,
          documentType: categories[file.name] || null,
          fileType: fileExtension,
          storageKey,
          sizeBytes: file.size,
          metadata: {
            originalName: file.name,
            mimeType: file.type,
            tags: tags[file.name] || [],
            // Store base64 content in metadata for now (no S3)
            // In production, this would be uploaded to S3 and removed from metadata
            content: base64Content,
          },
          embeddingStatus: "pending",
        },
      })

      createdDocuments.push({
        id: document.id,
        name: document.name,
        documentType: document.documentType,
        fileType: document.fileType,
        sizeBytes: document.sizeBytes,
        createdAt: document.createdAt.toISOString(),
      })
    }

    return NextResponse.json({
      message: `Successfully uploaded ${createdDocuments.length} file(s)`,
      documents: createdDocuments,
    })
  } catch (error) {
    console.error("Failed to upload documents:", error)
    return NextResponse.json(
      { error: "Failed to upload documents" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vaultId } = await params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "updatedAt"
    const sortDir = searchParams.get("sortDir") || "desc"

    // Verify vault exists
    const vault = await prisma.vault.findUnique({
      where: { id: vaultId },
      select: { id: true },
    })

    if (!vault) {
      return NextResponse.json(
        { error: "Vault not found" },
        { status: 404 }
      )
    }

    const orderByField = ["name", "documentType", "fileType", "sizeBytes", "updatedAt", "createdAt"].includes(sortBy)
      ? sortBy
      : "updatedAt"

    const documents = await prisma.document.findMany({
      where: {
        vaultId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { documentType: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: {
        [orderByField]: sortDir === "asc" ? "asc" : "desc",
      },
    })

    const response = documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      documentType: doc.documentType,
      fileType: doc.fileType,
      storageKey: doc.storageKey,
      sizeBytes: doc.sizeBytes,
      pageCount: doc.pageCount,
      embeddingStatus: doc.embeddingStatus,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error("Failed to fetch documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}
