import { generateText, Output } from "ai"
import { z } from "zod"
import { defaultModel } from "@/lib/ai"
import { prisma } from "@/lib/db"
import { createDraftingTools } from "@/lib/drafting-tools"

const regeneratedSectionSchema = z.object({
  content: z
    .string()
    .describe("The regenerated section content in markdown format"),
})

/**
 * Regenerates a single section of an existing draft.
 * Loads the full document for context, then regenerates only the target section.
 */
export async function regenerateSection(
  draftId: string,
  sectionId: string,
  instruction?: string,
): Promise<{ content: string; tiptapNodes: Record<string, unknown>[] }> {
  const draft = await prisma.caseDraft.findUniqueOrThrow({
    where: { id: draftId },
    select: {
      clientId: true,
      documentType: true,
      title: true,
      plainText: true,
      sections: true,
      content: true,
    },
  })

  const sections = draft.sections as
    | { id: string; title: string }[]
    | null

  if (!sections || sections.length === 0) {
    throw new Error("Draft has no sections metadata")
  }

  const targetSection = sections.find((s) => s.id === sectionId)
  if (!targetSection) {
    throw new Error(`Section '${sectionId}' not found in draft`)
  }

  const tools = createDraftingTools(draft.clientId)

  const { output: result } = await generateText({
    model: defaultModel,
    tools,
    output: Output.object({ schema: regeneratedSectionSchema }),
    prompt: `You are regenerating a single section of a ${draft.documentType.replace(/_/g, " ")} document titled "${draft.title ?? draft.documentType}".

## Full Document Context
${draft.plainText ?? "(no existing text)"}

## Section to Regenerate
Section ID: ${sectionId}
Section Title: ${targetSection.title}

${instruction ? `## User Instruction\n${instruction}` : ""}

Regenerate ONLY the "${targetSection.title}" section. Use the tools if you need additional context from the client's case. Return the section content in markdown format. Keep the same level of detail and tone as the rest of the document.`,
  })

  if (!result) {
    throw new Error("No output generated for section regeneration")
  }

  return {
    content: result.content,
    tiptapNodes: markdownToTiptapParagraphs(result.content),
  }
}

/**
 * Converts markdown text into an array of TipTap paragraph nodes.
 */
function markdownToTiptapParagraphs(
  markdown: string,
): Record<string, unknown>[] {
  const blocks = markdown.split(/\n\n+/).filter((b) => b.trim())

  return blocks.map((block) => {
    const trimmed = block.trim()

    const h3Match = trimmed.match(/^###\s+(.+)/)
    if (h3Match) {
      return {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: h3Match[1] }],
      }
    }

    if (trimmed.match(/^[-*]\s/m)) {
      const items = trimmed.split(/\n/).filter((l) => l.match(/^[-*]\s/))
      return {
        type: "bulletList",
        content: items.map((item) => ({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: item.replace(/^[-*]\s+/, "") },
              ],
            },
          ],
        })),
      }
    }

    const content = parseInlineFormatting(trimmed.replace(/\n/g, " "))
    return {
      type: "paragraph",
      content,
    }
  })
}

function parseInlineFormatting(
  text: string,
): { type: string; text: string; marks?: { type: string }[] }[] {
  const nodes: { type: string; text: string; marks?: { type: string }[] }[] = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) })
    }
    if (match[2]) {
      nodes.push({ type: "text", text: match[2], marks: [{ type: "bold" }] })
    } else if (match[3]) {
      nodes.push({
        type: "text",
        text: match[3],
        marks: [{ type: "italic" }],
      })
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) })
  }

  if (nodes.length === 0) {
    nodes.push({ type: "text", text })
  }

  return nodes
}
