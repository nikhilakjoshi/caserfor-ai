import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"
import type { RecommenderStatus, RecommenderSourceType } from "@prisma/client"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().optional(),
  organization: z.string().optional(),
  relationship: z.string().optional(),
  linkedinUrl: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum([
    "suggested", "identified", "contacted", "confirmed",
    "letter_drafted", "letter_finalized",
  ] as const satisfies readonly RecommenderStatus[]).optional(),
  sourceType: z.enum([
    "manual", "ai_suggested", "linkedin_extract",
  ] as const satisfies readonly RecommenderSourceType[]).optional(),
  aiReasoning: z.string().optional(),
  criteriaRelevance: z.array(z.string()).optional(),
})

type Params = { params: Promise<{ clientId: string; id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { clientId, id } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const existing = await prisma.recommender.findFirst({
      where: { id, clientId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Recommender not found" }, { status: 404 })
    }

    const recommender = await prisma.recommender.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json(recommender)
  } catch (error) {
    console.error("Error updating recommender:", error)
    return NextResponse.json({ error: "Failed to update recommender" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { clientId, id } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const existing = await prisma.recommender.findFirst({
      where: { id, clientId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Recommender not found" }, { status: 404 })
    }

    await prisma.recommender.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting recommender:", error)
    return NextResponse.json({ error: "Failed to delete recommender" }, { status: 500 })
  }
}
