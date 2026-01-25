import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { VaultType } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "recent"

    const vaults = await prisma.vault.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy:
        sortBy === "name"
          ? { name: "asc" }
          : sortBy === "created"
          ? { createdAt: "desc" }
          : { updatedAt: "desc" },
    })

    const response = vaults.map((vault) => ({
      id: vault.id,
      name: vault.name,
      description: vault.description,
      type: vault.type,
      isShared: vault.isShared,
      fileCount: vault._count.documents,
      createdAt: vault.createdAt.toISOString(),
      updatedAt: vault.updatedAt.toISOString(),
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error("Failed to fetch vaults:", error)
    return NextResponse.json(
      { error: "Failed to fetch vaults" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, type } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const validTypes: VaultType[] = ["knowledge_base", "sandbox"]
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid vault type" },
        { status: 400 }
      )
    }

    const vault = await prisma.vault.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type: type || "knowledge_base",
      },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    })

    return NextResponse.json(
      {
        id: vault.id,
        name: vault.name,
        description: vault.description,
        type: vault.type,
        isShared: vault.isShared,
        fileCount: vault._count.documents,
        createdAt: vault.createdAt.toISOString(),
        updatedAt: vault.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to create vault:", error)
    return NextResponse.json(
      { error: "Failed to create vault" },
      { status: 500 }
    )
  }
}
