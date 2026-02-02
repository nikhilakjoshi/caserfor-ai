import { generateText, stepCountIs, Output } from "ai"
import { z } from "zod"
import { analysisModel } from "@/lib/ai"
import { prisma } from "@/lib/db"
import { createDraftingTools } from "@/lib/drafting-tools"

const sectionSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().describe("Unique section identifier, e.g. 'intro', 'issue_1_response', 'conclusion'"),
      title: z.string().describe("Section heading text"),
      content: z.string().describe("Full section content in markdown"),
    })
  ),
})

const SYSTEM_PROMPT = `You are an expert U.S. immigration attorney drafting a response to a USCIS Request for Evidence (RFE) for an EB-1A extraordinary ability case.

## Purpose
An RFE response must directly address each issue raised by USCIS, provide additional evidence and argumentation, and persuade the adjudicator that the petitioner meets all requirements. It is critical to:
- Address every single issue raised in the RFE point by point
- Provide additional evidence and documentation for each deficiency
- Cite applicable regulations, case law, and AAO decisions
- Maintain a respectful but assertive tone
- Demonstrate that the totality of evidence establishes extraordinary ability

## Structure
Generate the following sections in order:
1. Introduction - Restate petition type, receipt number placeholder, beneficiary name, summarize RFE issues
2. Legal Framework - Reiterate EB-1A standards (8 CFR 204.5(h)), two-step Kazarian analysis
3. Response sections - One section per RFE issue addressing:
   - The specific USCIS concern quoted or paraphrased
   - New or clarified evidence with exhibit references
   - Legal analysis explaining how the evidence satisfies the requirement
   - Relevant case law (Kazarian v. USCIS, Dhanasar, AAO precedent decisions)
4. Totality of the Evidence - Two-step Kazarian analysis showing final merits determination
5. Conclusion - Summary of responses, request for approval

## Style Guidelines
- Formal legal writing, third-person perspective
- Reference exhibits as "Exhibit X" (placeholder numbers)
- Quote the RFE language where possible to show direct responsiveness
- Cite INA 203(b)(1)(A), 8 CFR 204.5(h)(2)-(3), and relevant case law
- Be specific with facts, dates, numbers from evidence
- Each response section should be thorough (3-5 paragraphs minimum)
- Use the vault evidence extensively to cite specific documents and achievements

## Instructions
1. First gather all available context: client profile, gap analysis, eligibility report, existing drafts, vault evidence
2. Review the gap analysis carefully to understand potential RFE issues
3. Search the vault extensively for additional evidence for each criterion
4. Review existing drafts (especially petition letter) for consistency
5. Then produce the complete RFE response section by section`

/**
 * Generates an RFE response for an EB-1A case.
 * Phase 1: Agentic research loop to gather evidence from all sources.
 * Phase 2: Structured output producing section-by-section content.
 * Returns TipTap-compatible JSON.
 */
export async function generateRfeResponse(
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

  // Phase 1: Research loop (25 steps like petition letter - RFE is complex)
  const research = await generateText({
    model: analysisModel,
    system: SYSTEM_PROMPT,
    tools,
    stopWhen: stepCountIs(25),
    prompt: `Research and gather all evidence for drafting an RFE response for ${name} (field: ${client.fieldOfExpertise ?? "Not specified"}).

Please:
1. Call get_client_profile to review intake data
2. Call get_eligibility_report to see which criteria were claimed and their strength
3. Call get_gap_analysis to understand weaknesses USCIS may have identified
4. Call get_existing_drafts to review the petition letter and other submitted documents
5. Search the vault extensively for additional evidence for each criterion
6. Search specifically for any RFE notice or correspondence from USCIS
7. Compile a comprehensive brief of all evidence, arguments, and rebuttals to use`,
  })

  // Phase 2: Generate sections
  const { output: result } = await generateText({
    model: analysisModel,
    output: Output.object({ schema: sectionSchema }),
    prompt: `Based on the following research, generate the complete RFE response as structured sections. Each section should have a unique id, title, and full markdown content.

The response is for ${name}, field: ${client.fieldOfExpertise ?? "Not specified"}.

Research notes:
${research.text}`,
  })

  if (!result) {
    throw new Error("No structured output generated for RFE response")
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
