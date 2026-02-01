import { z } from "zod"

// Step 1: Welcome (no schema needed)

// Step 2: Basic Info (name, email, consent)
export const step2Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  consentToProcess: z.boolean().optional(),
})

// Step 3: Resume Upload (no schema - file upload)

// Step 4: Background (citizenship, field, education, employer)
export const step4Schema = z.object({
  citizenship: z.string().optional(),
  fieldOfExpertise: z.string().min(1, "Field of expertise is required"),
  education: z
    .array(z.object({ institution: z.string(), degree: z.string(), year: z.string() }))
    .optional(),
  currentEmployer: z.string().optional(),
  dateOfBirth: z.string().optional(),
})

// Step 5: Evidence (criteria - handled by criteria-tab)

// Step 6: Achievement
export const step6Schema = z.object({
  hasMajorAchievement: z.boolean().optional(),
  majorAchievementDetails: z.string().optional(),
})

// Step 7: Immigration
export const step7Schema = z.object({
  currentImmigrationStatus: z.string().optional(),
  desiredStatus: z.string().optional(),
  previousApplications: z.string().optional(),
  usIntentType: z.string().optional(),
  usIntentDetails: z.string().optional(),
})

// Step 8: Circumstances
export const step8Schema = z.object({
  urgencyReason: z.string().optional(),
  specialCircumstances: z.string().optional(),
  urgency: z.string().optional(),
  idealTimeline: z.string().optional(),
})

// Step 9: Preferences
export const step9Schema = z.object({
  communicationPreference: z.string().optional(),
  timezone: z.string().optional(),
  altCategories: z.array(z.string()).optional(),
})

// Step 10: Review (no schema - summary display)

// Legacy exports for backward compat during transition
export const step1Schema = step2Schema.extend({
  fieldOfExpertise: z.string().min(1, "Field of expertise is required"),
  citizenship: z.string().optional(),
  dateOfBirth: z.string().optional(),
  education: z
    .array(z.object({ institution: z.string(), degree: z.string(), year: z.string() }))
    .optional(),
  currentEmployer: z.string().optional(),
  usIntentType: z.string().optional(),
  usIntentDetails: z.string().optional(),
})

export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type Step4Data = z.infer<typeof step4Schema>
export type Step6Data = z.infer<typeof step6Schema>
export type Step7Data = z.infer<typeof step7Schema>
export type Step8Data = z.infer<typeof step8Schema>
export type Step9Data = z.infer<typeof step9Schema>

// Impact schema (Step 6 in old flow, now used in step-criteria context)
export const impactSchema = z.object({
  socialFollowing: z.string().optional(),
  keynotes: z.string().optional(),
  recommenders: z
    .array(z.object({ name: z.string(), title: z.string(), relationship: z.string() }))
    .optional(),
  selfAssessment: z.string().optional(),
  standingLevel: z.string().optional(),
  recognitionScope: z.string().optional(),
})
export type ImpactData = z.infer<typeof impactSchema>

// Docs schema
export const docsSchema = z.object({
  evidenceChecklist: z.array(z.string()).optional(),
  priorConsultations: z.string().optional(),
})
export type DocsData = z.infer<typeof docsSchema>
