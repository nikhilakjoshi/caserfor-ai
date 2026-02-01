import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { VaultType } from "@prisma/client"
import { getUser } from "@/lib/get-user"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "recent"

    // Role-based vault filtering
    let vaultIdFilter: { id?: { in: string[] } } = {}
    if (user.role === "applicant") {
      // Applicant: only their own vault (via Client.vaultId)
      const client = await prisma.client.findFirst({
        where: { userId: user.id },
        select: { vaultId: true },
      })
      const ids = client?.vaultId ? [client.vaultId] : []
      vaultIdFilter = { id: { in: ids } }
    } else if (user.role === "lawyer") {
      // Lawyer: vaults for assigned cases
      const assignments = await prisma.caseAssignment.findMany({
        where: { lawyerId: user.id },
        select: { client: { select: { vaultId: true } } },
      })
      const ids = assignments
        .map((a) => a.client.vaultId)
        .filter((id): id is string => id !== null)
      vaultIdFilter = { id: { in: ids } }
    }
    // Admin: no filter (all vaults)

    const vaults = await prisma.vault.findMany({
      where: {
        ...vaultIdFilter,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
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
