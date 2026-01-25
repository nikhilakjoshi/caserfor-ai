import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const vault = await prisma.vault.findUnique({
      where: { id },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    })

    if (!vault) {
      return NextResponse.json(
        { error: "Vault not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: vault.id,
      name: vault.name,
      description: vault.description,
      type: vault.type,
      isShared: vault.isShared,
      maxFiles: vault.maxFiles,
      fileCount: vault._count.documents,
      createdAt: vault.createdAt.toISOString(),
      updatedAt: vault.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Failed to fetch vault:", error)
    return NextResponse.json(
      { error: "Failed to fetch vault" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, isShared } = body

    const vault = await prisma.vault.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isShared !== undefined && { isShared }),
      },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    })

    return NextResponse.json({
      id: vault.id,
      name: vault.name,
      description: vault.description,
      type: vault.type,
      isShared: vault.isShared,
      maxFiles: vault.maxFiles,
      fileCount: vault._count.documents,
      createdAt: vault.createdAt.toISOString(),
      updatedAt: vault.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Failed to update vault:", error)
    return NextResponse.json(
      { error: "Failed to update vault" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.vault.delete({
      where: { id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete vault:", error)
    return NextResponse.json(
      { error: "Failed to delete vault" },
      { status: 500 }
    )
  }
}
