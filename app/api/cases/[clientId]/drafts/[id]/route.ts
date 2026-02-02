import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"
import type { DraftStatus } from "@prisma/client"

const updateSchema = z.object({
  title: z.string().optional(),
  content: z.any().optional(),
  plainText: z.string().optional(),
  sections: z.any().optional(),
  status: z.enum([
    "not_started", "generating", "draft", "in_review", "final",
  ] as const satisfies readonly DraftStatus[]).optional(),
})

type Params = { params: Promise<{ clientId: string; id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { clientId, id } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const draft = await prisma.caseDraft.findFirst({
      where: { id, clientId },
      include: { recommender: { select: { id: true, name: true, title: true, organization: true } } },
    })

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    return NextResponse.json(draft)
  } catch (error) {
    console.error("Error fetching draft:", error)
    return NextResponse.json({ error: "Failed to fetch draft" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { clientId, id } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    // Applicant can only edit personal_statement
    const existing = await prisma.caseDraft.findFirst({
      where: { id, clientId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    if (
      result.user.role === "applicant" &&
      existing.documentType !== "personal_statement"
    ) {
      return NextResponse.json(
        { error: "Applicants can only edit personal statement drafts" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const draft = await prisma.caseDraft.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json(draft)
  } catch (error) {
    console.error("Error updating draft:", error)
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { clientId, id } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const existing = await prisma.caseDraft.findFirst({
      where: { id, clientId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    await prisma.caseDraft.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting draft:", error)
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 })
  }
}
