import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"

const createVersionSchema = z.object({
  versionNote: z.string().optional(),
})

type Params = { params: Promise<{ clientId: string; id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { clientId, id: draftId } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const draft = await prisma.caseDraft.findFirst({
      where: { id: draftId, clientId },
      select: { id: true },
    })
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    const versions = await prisma.caseDraftVersion.findMany({
      where: { draftId },
      select: { id: true, versionNote: true, createdBy: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(versions)
  } catch (error) {
    console.error("Error fetching versions:", error)
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { clientId, id: draftId } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const draft = await prisma.caseDraft.findFirst({
      where: { id: draftId, clientId },
    })
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    if (!draft.content) {
      return NextResponse.json(
        { error: "Draft has no content to snapshot" },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const parsed = createVersionSchema.safeParse(body)
    const versionNote = parsed.success ? parsed.data.versionNote : undefined

    const version = await prisma.caseDraftVersion.create({
      data: {
        draftId,
        content: draft.content,
        plainText: draft.plainText,
        sections: draft.sections ?? undefined,
        versionNote,
        createdBy: result.user.id,
      },
    })

    return NextResponse.json(version, { status: 201 })
  } catch (error) {
    console.error("Error creating version:", error)
    return NextResponse.json({ error: "Failed to create version" }, { status: 500 })
  }
}
