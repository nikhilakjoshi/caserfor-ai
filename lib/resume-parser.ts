import { generateObject } from "ai"
import { z } from "zod"
import { defaultModel } from "@/lib/ai"

const educationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  year: z.string(),
})

const resumeSchema = z.object({
  firstName: z.object({
    value: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  lastName: z.object({
    value: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  email: z.object({
    value: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  phone: z.object({
    value: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  citizenship: z.object({
    value: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  fieldOfExpertise: z.object({
    value: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  education: z.object({
    value: z.array(educationSchema).nullable(),
    confidence: z.number().min(0).max(1),
  }),
  currentEmployer: z.object({
    value: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  hasMajorAchievement: z.object({
    value: z.boolean().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  majorAchievementDetails: z.object({
    value: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  }),
})

export type ResumeParseResult = z.infer<typeof resumeSchema>

export type ParsedField<T = string | null> = {
  value: T
  confidence: number
}

/**
 * Parse resume text and extract structured fields with confidence scores.
 */
export async function parseResume(text: string): Promise<ResumeParseResult> {
  const truncated = text.slice(0, 16000)

  const { object } = await generateObject({
    model: defaultModel,
    schema: resumeSchema,
    prompt: `Extract structured information from this resume/CV. For each field, provide the extracted value and a confidence score (0-1) indicating how certain you are about the extraction.

Rules:
- Set value to null if the information is not found
- Set confidence to 0 if not found, low (<0.5) if ambiguous, high (>0.8) if clearly stated
- For education, extract all degrees/institutions found
- For fieldOfExpertise, infer from job titles, skills, and education
- For hasMajorAchievement, look for awards, patents, significant publications, or notable accomplishments
- For majorAchievementDetails, summarize the most notable achievement in 1-2 sentences
- citizenship is rarely on resumes; set null with 0 confidence if not explicitly stated

Resume text:
${truncated}`,
  })

  return object
}
