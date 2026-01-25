import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

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
