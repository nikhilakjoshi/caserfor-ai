import { generateText, stepCountIs, Output } from "ai"
import { z } from "zod"
import { defaultModel } from "@/lib/ai"
import { prisma } from "@/lib/db"
import { createDraftingTools } from "@/lib/drafting-tools"

const tocSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().describe("Unique section identifier, e.g. 'cover_page', 'petition_letter', 'exhibits'"),
      title: z.string().describe("Section heading text"),
      content: z.string().describe("Full section content in markdown"),
    })
  ),
})

const SYSTEM_PROMPT = `You are an expert immigration attorney assistant generating a Table of Contents for an EB-1A (Extraordinary Ability) visa petition package.

## Purpose
The Table of Contents is the master organizational document that:
- Lists every document in the petition package with page/tab references
- Provides the USCIS adjudicator a roadmap of the entire filing
- Must be comprehensive and match the actual petition contents
- Is typically the first page after the cover letter

## Structure
Generate the following sections:
1. Header - Title "TABLE OF CONTENTS" with petitioner name, case type (EB-1A / I-140), and date
2. Forms & Applications - I-140 petition, supporting forms, fee information
3. Petition Letter / Legal Brief - Reference to the main petition letter with subsections if available
4. Personal Statement / Declaration - Applicant's personal narrative
5. Recommendation Letters - Listed by recommender name and title
6. Exhibit List - Reference to the exhibit list document itself
7. Exhibits by Category - Grouped by EB-1A criterion, matching exhibit list numbering
8. Additional Supporting Documents - Any supplementary materials

## Formatting Guidelines
- Use a clear hierarchical format: major sections with subsections indented
- Include tab/exhibit references (e.g., "Tab A", "Exhibit 1") where applicable
- Each entry: "[Tab/Exhibit Ref] [Document Title] ............ [placeholder page]"
- Use dotted leaders between title and page reference for readability
- Cross-reference the exhibit list for consistent numbering
- Group recommendation letters together with recommender credentials
- Note if documents are originals, copies, or translations

## Instructions
1. Get the client profile for basic case information
2. Review all existing drafts to understand what documents have been prepared
3. Review the eligibility report for claimed criteria
4. Search the vault for uploaded documents to include
5. Check the exhibit list draft for consistent numbering
6. Compile a comprehensive TOC that covers every component of the petition package`

/**
 * Generates a Table of Contents for an EB-1A petition package.
 * Phase 1: Research loop to inventory all existing drafts and documents.
 * Phase 2: Structured output producing organized TOC.
 * Returns TipTap-compatible JSON.
 */
export async function generateTableOfContents(
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

  // Phase 1: Research loop - inventory all drafts and vault documents
  const research = await generateText({
    model: defaultModel,
    system: SYSTEM_PROMPT,
    tools,
    stopWhen: stepCountIs(15),
    prompt: `Research and inventory all documents for the EB-1A Table of Contents.

Applicant: ${applicantName}
Field: ${client.fieldOfExpertise ?? "Not specified"}

Please:
1. Call get_client_profile to review the applicant's intake data
2. Call get_eligibility_report to identify all claimed criteria
3. Call get_existing_drafts to see ALL prepared documents (petition letter, personal statement, recommendation letters, cover letter, exhibit list) - this is critical for the TOC
4. Search the vault for uploaded evidence documents:
   - Search for "evidence" and "document" for general files
   - Search for "award" "publication" "citation" for specific types
   - Search for "letter" "recommendation" for recommendation letters
   - Search for "form" "I-140" for immigration forms
5. Compile a complete inventory noting which drafts exist and their status`,
  })

  // Phase 2: Generate structured TOC
  const { output: result } = await generateText({
    model: defaultModel,
    output: Output.object({ schema: tocSchema }),
    prompt: `Based on the following research, generate the complete Table of Contents as structured sections for the EB-1A petition of ${applicantName} (field: ${client.fieldOfExpertise ?? "Not specified"}).

The TOC must reference all existing drafts and vault documents. Use consistent tab/exhibit numbering that matches the exhibit list if available.

Research notes:
${research.text}`,
  })

  if (!result) {
    throw new Error("No structured output generated for table of contents")
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
