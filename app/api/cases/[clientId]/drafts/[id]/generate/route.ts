import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"
import { generatePetitionLetter } from "@/lib/drafting-agents/petition-letter"
import { generatePersonalStatement } from "@/lib/drafting-agents/personal-statement"
import { generateRecommendationLetter } from "@/lib/drafting-agents/recommendation-letter"
import { generateCoverLetter } from "@/lib/drafting-agents/cover-letter"
import type { DraftDocumentType } from "@prisma/client"

type Params = { params: Promise<{ clientId: string; id: string }> }

const agentMap: Partial<
  Record<DraftDocumentType, (clientId: string, recommenderId?: string) => Promise<{
    tiptap: Record<string, unknown>
    sections: { id: string; title: string }[]
    plainText: string
  }>>
> = {
  petition_letter: (clientId) => generatePetitionLetter(clientId),
  personal_statement: (clientId) => generatePersonalStatement(clientId),
  recommendation_letter: (clientId, recommenderId) =>
    generateRecommendationLetter(clientId, recommenderId!),
  cover_letter: (clientId) => generateCoverLetter(clientId),
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { clientId, id } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const draft = await prisma.caseDraft.findFirst({
      where: { id, clientId },
    })
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    const agent = agentMap[draft.documentType]
    if (!agent) {
      return NextResponse.json(
        { error: `Generation not yet supported for ${draft.documentType}` },
        { status: 400 }
      )
    }

    if (draft.documentType === "recommendation_letter" && !draft.recommenderId) {
      return NextResponse.json(
        { error: "Recommendation letter draft requires a recommender" },
        { status: 400 }
      )
    }

    // Set status to generating
    await prisma.caseDraft.update({
      where: { id },
      data: { status: "generating" },
    })

    // Fire-and-forget async generation
    agent(clientId, draft.recommenderId ?? undefined)
      .then(async (output) => {
        await prisma.caseDraft.update({
          where: { id },
          data: {
            content: JSON.parse(JSON.stringify(output.tiptap)),
            plainText: output.plainText,
            sections: JSON.parse(JSON.stringify(output.sections)),
            status: "draft",
          },
        })
      })
      .catch(async (err) => {
        console.error(`Draft generation failed for ${id}:`, err)
        // Revert status so user can retry
        await prisma.caseDraft.update({
          where: { id },
          data: { status: "not_started" },
        }).catch(() => {})
      })

    return NextResponse.json({ status: "generating" }, { status: 202 })
  } catch (error) {
    console.error("Error triggering draft generation:", error)
    return NextResponse.json({ error: "Failed to trigger generation" }, { status: 500 })
  }
}
