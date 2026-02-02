import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"

type Params = { params: Promise<{ clientId: string; id: string; versionId: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { clientId, id: draftId, versionId } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const draft = await prisma.caseDraft.findFirst({
      where: { id: draftId, clientId },
      select: { id: true },
    })
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    const version = await prisma.caseDraftVersion.findFirst({
      where: { id: versionId, draftId },
    })
    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 })
    }

    return NextResponse.json(version)
  } catch (error) {
    console.error("Error fetching version:", error)
    return NextResponse.json({ error: "Failed to fetch version" }, { status: 500 })
  }
}
