import { generateText, stepCountIs, Output } from "ai"
import { z } from "zod"
import { analysisModel } from "@/lib/ai"
import { prisma } from "@/lib/db"
import { createDraftingTools } from "@/lib/drafting-tools"

const sectionSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().describe("Unique section identifier, e.g. 'intro', 'background', 'criterion_awards'"),
      title: z.string().describe("Section heading text"),
      content: z.string().describe("Full section content in markdown"),
    })
  ),
})

const SYSTEM_PROMPT = `You are an expert U.S. immigration attorney drafting an I-140 petition letter for an EB-1A extraordinary ability case.

## Purpose
The petition letter is the primary legal document submitted to USCIS. It must:
- Establish the petitioner's extraordinary ability in their field
- Demonstrate they meet at least 3 of 10 EB-1A criteria (or a one-time major achievement)
- Argue the petitioner will continue working in their area of expertise in the U.S.
- Be persuasive, precise, and well-organized with citations to exhibits

## Structure
Generate the following sections in order:
1. Introduction - State the petition type, beneficiary name, field of expertise
2. Legal Framework - Summarize EB-1A requirements (8 CFR 204.5(h))
3. Beneficiary Background - Education, career trajectory, field overview
4. Criterion sections - One section per qualifying criterion with:
   - Legal standard for the criterion
   - Evidence summary with exhibit references
   - Analysis of how evidence meets the standard
5. Comparable Evidence (if applicable)
6. Sustained National/International Acclaim - Totality argument
7. Future Plans in the U.S. - Prospective employment/endeavor
8. Conclusion

## Style Guidelines
- Formal legal writing, third-person perspective
- Reference exhibits as "Exhibit X" (placeholder numbers)
- Cite case law where appropriate (Kazarian, Dhanasar, etc.)
- Be specific with facts, dates, numbers from the client's profile
- Each criterion section should be 2-4 paragraphs minimum
- Use the vault evidence to cite specific documents and achievements

## Instructions
1. First gather all available context: client profile, gap analysis, eligibility report, existing drafts, vault evidence
2. Search the vault for specific evidence related to each criterion
3. Then produce the complete petition letter section by section`

/**
 * Generates a full I-140 petition letter for an EB-1A case.
 * Phase 1: Agentic research loop to gather evidence from all sources.
 * Phase 2: Structured output producing section-by-section content.
 * Returns TipTap-compatible JSON.
 */
export async function generatePetitionLetter(
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
    model: analysisModel,
    system: SYSTEM_PROMPT,
    tools,
    stopWhen: stepCountIs(25),
    prompt: `Research and gather all evidence for drafting the I-140 petition letter for ${name} (field: ${client.fieldOfExpertise ?? "Not specified"}).

Please:
1. Call get_client_profile to review intake data
2. Call get_eligibility_report to see which criteria are strongest
3. Call get_gap_analysis for strength assessment
4. Call get_existing_drafts to check for any prior work
5. Search the vault multiple times for evidence related to each qualifying criterion
6. Compile a comprehensive brief of all evidence and arguments to use`,
  })

  // Phase 2: Generate sections
  const { output: result } = await generateText({
    model: analysisModel,
    output: Output.object({ schema: sectionSchema }),
    prompt: `Based on the following research, generate the complete I-140 petition letter as structured sections. Each section should have a unique id, title, and full markdown content.

The letter is for ${name}, field: ${client.fieldOfExpertise ?? "Not specified"}.

Research notes:
${research.text}`,
  })

  if (!result) {
    throw new Error("No structured output generated for petition letter")
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
 * Simple conversion: splits on double newlines, each block becomes a paragraph.
 */
function markdownToTiptapParagraphs(
  markdown: string,
): Record<string, unknown>[] {
  const blocks = markdown.split(/\n\n+/).filter((b) => b.trim())

  return blocks.map((block) => {
    const trimmed = block.trim()

    // Handle sub-headings (###)
    const h3Match = trimmed.match(/^###\s+(.+)/)
    if (h3Match) {
      return {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: h3Match[1] }],
      }
    }

    // Handle bullet lists
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

    // Default: paragraph with inline bold/italic
    const content = parseInlineFormatting(trimmed.replace(/\n/g, " "))
    return {
      type: "paragraph",
      content,
    }
  })
}

/**
 * Parses inline markdown bold/italic into TipTap text nodes with marks.
 */
function parseInlineFormatting(
  text: string,
): { type: string; text: string; marks?: { type: string }[] }[] {
  const nodes: { type: string; text: string; marks?: { type: string }[] }[] = []
  // Match **bold** and *italic*
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
