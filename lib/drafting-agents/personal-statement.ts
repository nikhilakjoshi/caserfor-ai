import { generateText, stepCountIs, Output } from "ai"
import { z } from "zod"
import { defaultModel } from "@/lib/ai"
import { prisma } from "@/lib/db"
import { createDraftingTools } from "@/lib/drafting-tools"

const sectionSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().describe("Unique section identifier, e.g. 'opening', 'journey', 'achievements'"),
      title: z.string().describe("Section heading text"),
      content: z.string().describe("Full section content in markdown"),
    })
  ),
})

const SYSTEM_PROMPT = `You are a skilled writer helping an EB-1A visa applicant draft a compelling personal statement (also called a personal declaration or beneficiary statement).

## Purpose
The personal statement is a first-person narrative that:
- Tells the applicant's professional story and journey in their field
- Explains their extraordinary contributions and achievements in their own words
- Provides personal context that formal legal documents cannot convey
- Supplements the petition letter with the applicant's voice and perspective
- Explains motivations, challenges overcome, and future plans in the U.S.

## Structure
Generate the following sections in order:
1. Opening - Introduce yourself, your field, and your core expertise
2. Professional Journey - Education, career path, key turning points
3. Key Achievements - Major accomplishments with specific details (awards, publications, impact metrics)
4. Contributions to the Field - How your work has advanced your field, influenced peers, or created lasting impact
5. Recognition - How peers, institutions, and the broader community have recognized your work
6. Future Plans - What you intend to accomplish in the United States and why the U.S. is essential for your work
7. Closing - Summarize why you believe you qualify for EB-1A classification

## Style Guidelines
- First-person perspective ("I", "my")
- Personal but professional tone - authentic, not overly formal
- Include specific facts, dates, numbers from the applicant's profile
- Show passion for the field while remaining credible
- Reference specific evidence that supports each claim
- Each section should be 2-4 paragraphs
- Avoid legal jargon - this is the applicant's voice, not the attorney's

## Instructions
1. First gather all available context: client profile, eligibility report, gap analysis, vault evidence
2. Search the vault for specific achievements and supporting documents
3. Then produce the complete personal statement section by section`

/**
 * Generates a personal statement for an EB-1A applicant.
 * Phase 1: Research loop to gather context.
 * Phase 2: Structured output producing section-by-section content.
 * Returns TipTap-compatible JSON.
 */
export async function generatePersonalStatement(
  clientId: string,
): Promise<{
  tiptap: Record<string, unknown>
  sections: { id: string; title: string }[]
  plainText: string
}> {
  const tools = createDraftingTools(clientId)

  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    select: { firstName: true, lastName: true, fieldOfExpertise: true },
  })

  const name = `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()

  // Phase 1: Research loop
  const research = await generateText({
    model: defaultModel,
    system: SYSTEM_PROMPT,
    tools,
    stopWhen: stepCountIs(15),
    prompt: `Research and gather all context for drafting the personal statement for ${name} (field: ${client.fieldOfExpertise ?? "Not specified"}).

Please:
1. Call get_client_profile to review intake data and personal details
2. Call get_eligibility_report to understand which criteria are strongest
3. Call get_gap_analysis for strength assessment
4. Call get_existing_drafts to check for any prior work
5. Search the vault for key achievements, publications, awards, and recognition
6. Compile all relevant personal and professional details`,
  })

  // Phase 2: Generate sections
  const { output: result } = await generateText({
    model: defaultModel,
    output: Output.object({ schema: sectionSchema }),
    prompt: `Based on the following research, generate the complete personal statement as structured sections. Write in first person as the applicant. Each section should have a unique id, title, and full markdown content.

The statement is for ${name}, field: ${client.fieldOfExpertise ?? "Not specified"}.

Research notes:
${research.text}`,
  })

  if (!result) {
    throw new Error("No structured output generated for personal statement")
  }

  // Convert sections to TipTap JSON
  const tiptapContent = result.sections.flatMap((section) => [
    {
      type: "heading",
      attrs: { level: 2, id: section.id },
      content: [{ type: "text", text: section.title }],
    },
    ...markdownToTiptapParagraphs(section.content),
  ])

  const tiptap = {
    type: "doc",
    content: tiptapContent,
  }

  const plainText = result.sections
    .map((s) => `## ${s.title}\n\n${s.content}`)
    .join("\n\n")

  const sections = result.sections.map((s) => ({
    id: s.id,
    title: s.title,
  }))

  return { tiptap, sections, plainText }
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
