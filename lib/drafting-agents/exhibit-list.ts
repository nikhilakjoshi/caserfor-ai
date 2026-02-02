import { generateText, stepCountIs, Output } from "ai"
import { z } from "zod"
import { defaultModel } from "@/lib/ai"
import { prisma } from "@/lib/db"
import { createDraftingTools } from "@/lib/drafting-tools"

const exhibitListSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().describe("Unique section identifier, e.g. 'intro', 'criteria_1', 'appendix'"),
      title: z.string().describe("Section heading text"),
      content: z.string().describe("Full section content in markdown"),
    })
  ),
})

const SYSTEM_PROMPT = `You are an expert immigration attorney assistant helping compile a numbered exhibit list for an EB-1A (Extraordinary Ability) visa petition package.

## Purpose
The exhibit list is a critical organizational document that:
- Provides a numbered index of all supporting evidence enclosed with the I-140 petition
- Groups exhibits by the EB-1A criterion they support
- Includes brief descriptions of each exhibit
- Serves as a reference guide for the USCIS adjudicator
- Is cross-referenced by the petition letter and cover letter

## Structure
Generate the following sections:
1. Header - Title "EXHIBIT LIST" with petitioner name, case type (EB-1A / I-140), and date
2. General Exhibits - Identity documents, immigration forms, educational credentials, CV/resume (Exhibits A-series)
3. Per-Criterion Exhibit Groups - For each claimed EB-1A criterion, a numbered group of exhibits with descriptions. Use the criterion name as the group heading. Number exhibits sequentially (e.g., Exhibit 1, Exhibit 2, ...) or by criterion tab (e.g., Tab A, Tab B)
4. Additional Supporting Evidence - Any supplementary materials not tied to a specific criterion

## Formatting Guidelines
- Each exhibit entry should follow: "Exhibit [Number]: [Document Title] - [Brief description of what the document demonstrates]"
- Use bullet lists for exhibit entries within each group
- Include the total exhibit count at the end
- Reference actual vault documents by name when available
- If a vault document is relevant to multiple criteria, list it under the primary criterion and cross-reference
- Keep descriptions concise (1-2 sentences each)
- Note any documents that are translations or certified copies

## Instructions
1. Get the client profile for basic case information
2. Review the eligibility report to identify all claimed criteria
3. Review gap analysis for evidence strengths
4. Search the vault thoroughly for ALL uploaded documents - these are the actual exhibits
5. Check existing drafts (petition letter, cover letter) for exhibit references to maintain consistency
6. Compile a comprehensive, numbered exhibit list organized by criterion`

/**
 * Generates a numbered exhibit list for an EB-1A petition package.
 * Phase 1: Research loop to catalog vault documents and case context.
 * Phase 2: Structured output producing organized exhibit list.
 * Returns TipTap-compatible JSON.
 */
export async function generateExhibitList(
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

  const applicantName = `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()

  // Phase 1: Research loop - heavier research to catalog all vault documents
  const research = await generateText({
    model: defaultModel,
    system: SYSTEM_PROMPT,
    tools,
    stopWhen: stepCountIs(20),
    prompt: `Research and catalog all available evidence for the EB-1A exhibit list.

Applicant: ${applicantName}
Field: ${client.fieldOfExpertise ?? "Not specified"}

Please:
1. Call get_client_profile to review the applicant's intake data and evidence checklist
2. Call get_eligibility_report to identify all claimed criteria and supporting evidence
3. Call get_gap_analysis for evidence strength assessment
4. Call get_existing_drafts to check petition letter and cover letter for exhibit references
5. Search the vault extensively - use multiple queries to find ALL uploaded documents:
   - Search for "evidence" to find general evidence files
   - Search for "award" "publication" "citation" for specific exhibit types
   - Search for "letter" "recommendation" for recommendation letters
   - Search for "contract" "employment" "salary" for employment evidence
   - Search for "media" "press" "article" for media coverage
   - Search for "membership" "organization" for professional memberships
   - Search for "patent" "contribution" for original contributions
6. Compile a complete inventory of all available documents and their relevance to EB-1A criteria`,
  })

  // Phase 2: Generate structured exhibit list
  const { output: result } = await generateText({
    model: defaultModel,
    output: Output.object({ schema: exhibitListSchema }),
    prompt: `Based on the following research, generate the complete exhibit list as structured sections for the EB-1A petition of ${applicantName} (field: ${client.fieldOfExpertise ?? "Not specified"}).

Reference actual vault document names wherever possible. Number exhibits sequentially and group by criterion.

Research notes:
${research.text}`,
  })

  if (!result) {
    throw new Error("No structured output generated for exhibit list")
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
