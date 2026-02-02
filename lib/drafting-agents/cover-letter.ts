import { generateText, stepCountIs, Output } from "ai"
import { z } from "zod"
import { defaultModel } from "@/lib/ai"
import { prisma } from "@/lib/db"
import { createDraftingTools } from "@/lib/drafting-tools"

const sectionSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().describe("Unique section identifier, e.g. 'header', 'intro', 'overview'"),
      title: z.string().describe("Section heading text"),
      content: z.string().describe("Full section content in markdown"),
    })
  ),
})

const SYSTEM_PROMPT = `You are an expert immigration attorney assistant helping draft a cover letter for an EB-1A (Extraordinary Ability) visa petition package.

## Purpose
The cover letter accompanies the I-140 petition package and serves as a roadmap for the USCIS adjudicator. It:
- Introduces the petitioner and summarizes the basis for the petition
- Lists all enclosed exhibits and supporting documents
- Provides a concise legal argument for why the petitioner qualifies under EB-1A
- References the specific regulatory criteria (8 CFR 204.5(h)(3)) being claimed
- Guides the adjudicator through the petition package organization

## Structure
Generate the following sections in order:
1. Header - Law firm letterhead info, date, USCIS service center address, RE line with petitioner name and case type
2. Introduction - Brief introduction of the petitioner, their field, and the basis for the EB-1A petition
3. Eligibility Overview - Summary of which EB-1A criteria are being claimed (minimum 3 of 10) and brief statement on sustained national/international acclaim
4. Criteria Summary - For each claimed criterion, a concise paragraph summarizing the evidence and key exhibits supporting it
5. Exhibit List Reference - Brief description of the enclosed exhibit organization and total count
6. Conclusion - Formal request for approval, offer to provide additional information, signature block

## Style Guidelines
- Formal legal correspondence tone
- Addressed to "Dear Sir or Madam" or "Dear USCIS Officer"
- Concise but thorough - this is a summary document, not the detailed petition letter
- Reference exhibit numbers where applicable (use "Exhibit X" placeholders)
- Include relevant legal citations (INA 203(b)(1)(A), 8 CFR 204.5(h)(3))
- Each section should be 1-3 paragraphs
- Professional closing with attorney signature block placeholder

## Instructions
1. Gather the applicant's profile and intake data
2. Review the eligibility report to identify claimed criteria
3. Review gap analysis for strength assessment
4. Check existing drafts (especially petition letter) for consistency
5. Search the vault for key evidence to reference
6. Produce the complete cover letter section by section`

/**
 * Generates a cover letter for an EB-1A petition package.
 * Phase 1: Research loop to gather applicant context.
 * Phase 2: Structured output producing section-by-section content.
 * Returns TipTap-compatible JSON.
 */
export async function generateCoverLetter(
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

  // Phase 1: Research loop
  const research = await generateText({
    model: defaultModel,
    system: SYSTEM_PROMPT,
    tools,
    stopWhen: stepCountIs(15),
    prompt: `Research and gather all context for drafting a cover letter for the EB-1A petition package.

Applicant: ${applicantName}
Field: ${client.fieldOfExpertise ?? "Not specified"}

Please:
1. Call get_client_profile to review the applicant's intake data
2. Call get_eligibility_report to understand which criteria are claimed and strongest
3. Call get_gap_analysis for strength assessment
4. Call get_existing_drafts to check for prior drafts (especially petition letter for consistency)
5. Search the vault for key exhibits and evidence documents
6. Compile all relevant details for the cover letter`,
  })

  // Phase 2: Generate sections
  const { output: result } = await generateText({
    model: defaultModel,
    output: Output.object({ schema: sectionSchema }),
    prompt: `Based on the following research, generate the complete cover letter as structured sections for the EB-1A petition of ${applicantName} (field: ${client.fieldOfExpertise ?? "Not specified"}).

Research notes:
${research.text}`,
  })

  if (!result) {
    throw new Error("No structured output generated for cover letter")
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
