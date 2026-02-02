import { generateText, stepCountIs, Output } from "ai"
import { z } from "zod"
import { defaultModel } from "@/lib/ai"
import { prisma } from "@/lib/db"
import { createDraftingTools } from "@/lib/drafting-tools"

const sectionSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().describe("Unique section identifier, e.g. 'intro', 'relationship', 'achievements'"),
      title: z.string().describe("Section heading text"),
      content: z.string().describe("Full section content in markdown"),
    })
  ),
})

const SYSTEM_PROMPT = `You are an expert immigration attorney assistant helping draft a recommendation letter for an EB-1A (Extraordinary Ability) visa petition.

## Purpose
A recommendation letter is written from the perspective of a professional peer, mentor, collaborator, or expert in the field who can attest to the applicant's extraordinary abilities and contributions. The letter:
- Establishes the recommender's own credentials and authority to evaluate the applicant
- Describes the recommender's relationship with and knowledge of the applicant's work
- Provides specific, detailed testimony about the applicant's extraordinary achievements
- Explains how the applicant's contributions have impacted the field
- Supports specific EB-1A criteria with concrete examples and professional judgment

## Structure
Generate the following sections in order:
1. Introduction - The recommender introduces themselves, their credentials, position, and expertise
2. Relationship - How the recommender knows the applicant, the nature and duration of their professional relationship
3. Applicant's Expertise - Detailed description of the applicant's specific contributions and technical achievements
4. Impact on the Field - How the applicant's work has advanced the field, influenced other researchers/practitioners, or created lasting impact
5. Criterion-Specific Testimony - Specific testimony supporting the EB-1A criteria most relevant to this recommender's knowledge (awards, publications, judging, original contributions, etc.)
6. Comparison to Peers - How the applicant stands out compared to others in the field
7. Conclusion - Strong closing endorsement of the applicant's extraordinary ability classification

## Style Guidelines
- Written in third-person from the recommender's perspective ("I have known Dr. X for...")
- Formal, professional tone appropriate for USCIS submission
- Include specific facts, dates, metrics from both the recommender's and applicant's profiles
- Reference specific publications, projects, or achievements by name
- Avoid generic praise - every claim should be backed by a concrete example
- Each section should be 2-4 paragraphs
- The letter should read as a genuine professional endorsement, not a template

## Instructions
1. First gather the recommender's details (name, title, organization, relationship, notes)
2. Gather the applicant's profile, eligibility report, and gap analysis
3. Search the vault for evidence relevant to this recommender's area of expertise
4. Then produce the complete recommendation letter section by section`

/**
 * Generates a recommendation letter for an EB-1A applicant from a specific recommender.
 * Phase 1: Research loop to gather recommender + applicant context.
 * Phase 2: Structured output producing section-by-section content.
 * Returns TipTap-compatible JSON.
 */
export async function generateRecommendationLetter(
  clientId: string,
  recommenderId: string,
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

  const recommender = await prisma.recommender.findUniqueOrThrow({
    where: { id: recommenderId },
    select: {
      name: true,
      title: true,
      organization: true,
      relationship: true,
      notes: true,
      criteriaRelevance: true,
    },
  })

  const applicantName = `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()

  // Phase 1: Research loop
  const research = await generateText({
    model: defaultModel,
    system: SYSTEM_PROMPT,
    tools,
    stopWhen: stepCountIs(20),
    prompt: `Research and gather all context for drafting a recommendation letter.

Recommender: ${recommender.name}
Title: ${recommender.title ?? "Not specified"}
Organization: ${recommender.organization ?? "Not specified"}
Relationship to applicant: ${recommender.relationship ?? "Not specified"}
Notes about recommender: ${recommender.notes ?? "None"}
Criteria relevance: ${recommender.criteriaRelevance?.join(", ") || "Not specified"}

Applicant: ${applicantName}
Field: ${client.fieldOfExpertise ?? "Not specified"}

Please:
1. Call get_recommender with id "${recommenderId}" for full recommender details
2. Call get_client_profile to review the applicant's intake data
3. Call get_eligibility_report to understand which criteria are strongest
4. Call get_gap_analysis for strength assessment
5. Call get_existing_drafts to check for prior drafts (especially petition letter for consistency)
6. Search the vault for evidence relevant to the recommender's area of expertise and the criteria they can speak to
7. Compile all relevant details about both the recommender and applicant`,
  })

  // Phase 2: Generate sections
  const { output: result } = await generateText({
    model: defaultModel,
    output: Output.object({ schema: sectionSchema }),
    prompt: `Based on the following research, generate the complete recommendation letter as structured sections. Write from the perspective of ${recommender.name} (${recommender.title ?? "professional"} at ${recommender.organization ?? "their organization"}).

The letter recommends ${applicantName} (field: ${client.fieldOfExpertise ?? "Not specified"}) for EB-1A extraordinary ability classification.

Recommender's relationship: ${recommender.relationship ?? "professional colleague"}
Criteria this recommender can speak to: ${recommender.criteriaRelevance?.join(", ") || "general expertise"}

Research notes:
${research.text}`,
  })

  if (!result) {
    throw new Error("No structured output generated for recommendation letter")
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
