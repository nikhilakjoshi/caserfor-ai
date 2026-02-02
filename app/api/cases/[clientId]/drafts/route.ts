import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"
import type { DraftDocumentType } from "@prisma/client"

const createSchema = z.object({
  documentType: z.enum([
    "petition_letter", "personal_statement", "recommendation_letter",
    "cover_letter", "exhibit_list", "table_of_contents", "rfe_response",
  ] as const satisfies readonly DraftDocumentType[]),
  title: z.string().optional(),
  recommenderId: z.string().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const drafts = await prisma.caseDraft.findMany({
      where: { clientId },
      select: {
        id: true,
        documentType: true,
        title: true,
        status: true,
        recommenderId: true,
        updatedAt: true,
        recommender: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(drafts)
  } catch (error) {
    console.error("Error fetching drafts:", error)
    return NextResponse.json({ error: "Failed to fetch drafts" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { documentType, title, recommenderId } = parsed.data

    if (documentType === "recommendation_letter" && !recommenderId) {
      return NextResponse.json(
        { error: "recommenderId required for recommendation_letter" },
        { status: 400 }
      )
    }

    // Check unique constraint before insert to return 409
    const existing = await prisma.caseDraft.findFirst({
      where: { clientId, documentType, recommenderId: recommenderId ?? null },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Draft already exists for this document type" },
        { status: 409 }
      )
    }

    const draft = await prisma.caseDraft.create({
      data: { clientId, documentType, title, recommenderId },
    })

    return NextResponse.json(draft, { status: 201 })
  } catch (error) {
    console.error("Error creating draft:", error)
    return NextResponse.json({ error: "Failed to create draft" }, { status: 500 })
  }
}
