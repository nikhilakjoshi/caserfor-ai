import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { authorizeCaseAccess, isAuthError } from "@/lib/case-auth"
import { regenerateSection } from "@/lib/drafting-agents/regenerate-section"

type Params = { params: Promise<{ clientId: string; id: string }> }

const bodySchema = z.object({
  sectionId: z.string().min(1),
  instruction: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { clientId, id } = await params
    const result = await authorizeCaseAccess(clientId)
    if (isAuthError(result)) return result

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { sectionId, instruction } = parsed.data

    const draft = await prisma.caseDraft.findFirst({
      where: { id, clientId },
      select: { id: true, content: true, sections: true },
    })
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 })
    }

    // Fire-and-forget: regenerate section and update draft content
    regenerateSection(id, sectionId, instruction)
      .then(async ({ content: sectionMarkdown, tiptapNodes }) => {
        // Load current draft content and replace the target section
        const currentDraft = await prisma.caseDraft.findUniqueOrThrow({
          where: { id },
          select: { content: true, plainText: true, sections: true },
        })

        const tiptapDoc = currentDraft.content as {
          type: string
          content: Record<string, unknown>[]
        } | null

        if (!tiptapDoc || !tiptapDoc.content) return

        // Find the section heading node and replace content until next heading
        const nodes = tiptapDoc.content
        const newNodes: Record<string, unknown>[] = []
        let inTargetSection = false
        let replaced = false

        for (const node of nodes) {
          const isHeading =
            node.type === "heading" &&
            (node as { attrs?: { id?: string } }).attrs?.id === sectionId

          if (isHeading) {
            // Keep the heading, inject new content
            newNodes.push(node)
            newNodes.push(...tiptapNodes)
            inTargetSection = true
            replaced = true
            continue
          }

          // Next h2 heading = end of target section
          if (
            inTargetSection &&
            node.type === "heading" &&
            (node as { attrs?: { level?: number } }).attrs?.level === 2
          ) {
            inTargetSection = false
          }

          if (!inTargetSection) {
            newNodes.push(node)
          }
        }

        if (!replaced) return

        const updatedDoc = { ...tiptapDoc, content: newNodes }

        // Rebuild plainText from sections
        const sections = currentDraft.sections as
          | { id: string; title: string }[]
          | null
        let plainText = currentDraft.plainText ?? ""
        if (sections) {
          const targetTitle = sections.find((s) => s.id === sectionId)?.title
          if (targetTitle) {
            // Replace section in plainText
            const sectionRegex = new RegExp(
              `(## ${escapeRegex(targetTitle)}\n\n)[\\s\\S]*?(?=\n\n## |$)`
            )
            plainText = plainText.replace(sectionRegex, `$1${sectionMarkdown}`)
          }
        }

        await prisma.caseDraft.update({
          where: { id },
          data: {
            content: JSON.parse(JSON.stringify(updatedDoc)),
            plainText,
          },
        })
      })
      .catch((err) => {
        console.error(`Section regeneration failed for draft ${id}, section ${sectionId}:`, err)
      })

    return NextResponse.json({ status: "regenerating" }, { status: 202 })
  } catch (error) {
    console.error("Error triggering section regeneration:", error)
    return NextResponse.json(
      { error: "Failed to trigger regeneration" },
      { status: 500 }
    )
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
