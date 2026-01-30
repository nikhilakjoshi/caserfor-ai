import { z } from "zod"

// Step 1: Personal Background
export const step1Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  citizenship: z.string().optional(),
  fieldOfExpertise: z.string().min(1, "Field of expertise is required"),
  education: z
    .array(z.object({ institution: z.string(), degree: z.string(), year: z.string() }))
    .optional(),
  currentEmployer: z.string().optional(),
  usIntentType: z.string().optional(),
  usIntentDetails: z.string().optional(),
})

// Step 2: Major Achievement
export const step2Schema = z.object({
  hasMajorAchievement: z.boolean().optional(),
  majorAchievementDetails: z.string().optional(),
})

// Step 4: Impact & Standing
export const step4Schema = z.object({
  socialFollowing: z.string().optional(),
  keynotes: z.string().optional(),
  recommenders: z
    .array(z.object({ name: z.string(), title: z.string(), relationship: z.string() }))
    .optional(),
  selfAssessment: z.string().optional(),
  standingLevel: z.string().optional(),
  recognitionScope: z.string().optional(),
})

// Step 5: Documents & Timeline
export const step5Schema = z.object({
  evidenceChecklist: z.array(z.string()).optional(),
  urgency: z.string().optional(),
  idealTimeline: z.string().optional(),
  priorConsultations: z.string().optional(),
  altCategories: z.array(z.string()).optional(),
})

export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type Step4Data = z.infer<typeof step4Schema>
export type Step5Data = z.infer<typeof step5Schema>
