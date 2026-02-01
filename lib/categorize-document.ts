import { generateObject } from "ai"
import { z } from "zod"
import { defaultModel } from "@/lib/ai"
import { CATEGORY_SLUGS } from "@/lib/document-categories"

const categorizationSchema = z.object({
  category: z.enum(CATEGORY_SLUGS as [string, ...string[]]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
})

export type CategorizationResult = z.infer<typeof categorizationSchema>

/**
 * Categorize a document using AI based on its filename and text content.
 * Uses first ~3000 tokens (~12000 chars) of text for classification.
 */
export async function categorizeDocument(
  filename: string,
  text: string
): Promise<CategorizationResult> {
  const truncatedText = text.slice(0, 12000)

  const categoryList = CATEGORY_SLUGS.join(", ")

  const { object } = await generateObject({
    model: defaultModel,
    schema: categorizationSchema,
    prompt: `Classify this document into one of these categories: ${categoryList}

Category guidance:
- immigration-form: USCIS forms (I-140, I-485, etc.), visa applications, immigration petitions
- financial-record: Tax returns, pay stubs, bank statements, W-2s, financial evidence
- personal-statement: Personal narratives, cover letters, self-authored statements of purpose
- business-plan: Business plans, market analyses, entrepreneurial proposals
- identity-document: Passports, birth certificates, driver licenses, identity verification
- awards through commercial-success: EB1A evidence categories
- contract through other: General legal document categories

Filename: ${filename}

Document text (first ~3000 tokens):
${truncatedText}

Pick the single best category. Return confidence 0-1 and brief reasoning.`,
  })

  return object
}
