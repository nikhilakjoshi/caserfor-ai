import type { ResumeParseResult } from "@/lib/resume-parser"
import type { BrightDataLinkedInResult } from "@/lib/brightdata"
import { generateText, Output } from "ai"
import { defaultModel } from "@/lib/ai"
import { z } from "zod"

/**
 * Map Bright Data structured LinkedIn response to ResumeParseResult.
 * Since BD returns structured JSON, this is a direct mapping with high confidence.
 */
export function parseLinkedInProfile(profile: BrightDataLinkedInResult): ResumeParseResult {
  const nameParts = (profile.name || "").trim().split(/\s+/)
  const firstName = nameParts[0] || null
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null

  const education = (profile.education || []).map((e) => ({
    institution: e.school,
    degree: [e.degree, e.field_of_study].filter(Boolean).join(", ") || "Unknown",
    year: e.end_date || e.start_date || "",
  }))

  const currentJob = profile.experience?.[0]
  const fieldOfExpertise = profile.headline || currentJob?.title || null

  // Scan for notable achievements
  const hasHonors = (profile.honors?.length ?? 0) > 0
  const hasPubs = (profile.publications?.length ?? 0) > 0
  const hasMajorAchievement = hasHonors || hasPubs

  const achievementParts: string[] = []
  if (profile.honors?.length) {
    achievementParts.push(
      profile.honors.slice(0, 3).map((h) => h.title).join("; ")
    )
  }
  if (profile.publications?.length) {
    achievementParts.push(
      `${profile.publications.length} publication(s): ${profile.publications.slice(0, 2).map((p) => p.title).join("; ")}`
    )
  }

  return {
    firstName: { value: firstName, confidence: firstName ? 0.95 : 0 },
    lastName: { value: lastName, confidence: lastName ? 0.95 : 0 },
    email: { value: null, confidence: 0 },
    phone: { value: null, confidence: 0 },
    citizenship: {
      value: profile.location || null,
      confidence: profile.location ? 0.3 : 0,
    },
    fieldOfExpertise: {
      value: fieldOfExpertise,
      confidence: fieldOfExpertise ? 0.85 : 0,
    },
    education: {
      value: education.length > 0 ? education : null,
      confidence: education.length > 0 ? 0.9 : 0,
    },
    currentEmployer: {
      value: currentJob?.company || null,
      confidence: currentJob?.company ? 0.9 : 0,
    },
    hasMajorAchievement: {
      value: hasMajorAchievement,
      confidence: hasMajorAchievement ? 0.75 : 0.4,
    },
    majorAchievementDetails: {
      value: achievementParts.length > 0 ? achievementParts.join(". ") : null,
      confidence: achievementParts.length > 0 ? 0.7 : 0,
    },
  }
}

/**
 * Convert structured LinkedIn profile to human-readable text for vault storage / RAG.
 */
export function linkedInProfileToText(profile: BrightDataLinkedInResult): string {
  const sections: string[] = []

  if (profile.name) sections.push(`Name: ${profile.name}`)
  if (profile.headline) sections.push(`Headline: ${profile.headline}`)
  if (profile.location) sections.push(`Location: ${profile.location}`)

  if (profile.about) {
    sections.push(`\n--- Summary ---\n${profile.about}`)
  }

  if (profile.experience?.length) {
    const lines = profile.experience.map((e) => {
      const period = [e.start_date, e.end_date].filter(Boolean).join(" - ")
      const loc = e.location ? ` (${e.location})` : ""
      const desc = e.description ? `\n  ${e.description}` : ""
      return `- ${e.title} at ${e.company}${loc}${period ? ` [${period}]` : ""}${desc}`
    })
    sections.push(`\n--- Experience ---\n${lines.join("\n")}`)
  }

  if (profile.education?.length) {
    const lines = profile.education.map((e) => {
      const deg = [e.degree, e.field_of_study].filter(Boolean).join(", ")
      const period = [e.start_date, e.end_date].filter(Boolean).join(" - ")
      return `- ${e.school}${deg ? `: ${deg}` : ""}${period ? ` [${period}]` : ""}`
    })
    sections.push(`\n--- Education ---\n${lines.join("\n")}`)
  }

  if (profile.skills?.length) {
    sections.push(`\n--- Skills ---\n${profile.skills.join(", ")}`)
  }

  if (profile.publications?.length) {
    const lines = profile.publications.map((p) => {
      const meta = [p.publisher, p.date].filter(Boolean).join(", ")
      return `- ${p.title}${meta ? ` (${meta})` : ""}${p.description ? `\n  ${p.description}` : ""}`
    })
    sections.push(`\n--- Publications ---\n${lines.join("\n")}`)
  }

  if (profile.honors?.length) {
    const lines = profile.honors.map((h) => {
      const meta = [h.issuer, h.date].filter(Boolean).join(", ")
      return `- ${h.title}${meta ? ` (${meta})` : ""}${h.description ? `\n  ${h.description}` : ""}`
    })
    sections.push(`\n--- Honors & Awards ---\n${lines.join("\n")}`)
  }

  if (profile.certifications?.length) {
    const lines = profile.certifications.map(
      (c) => `- ${c.name}${c.authority ? ` (${c.authority})` : ""}`
    )
    sections.push(`\n--- Certifications ---\n${lines.join("\n")}`)
  }

  if (profile.volunteering?.length) {
    const lines = profile.volunteering.map(
      (v) => `- ${v.role} at ${v.organization}`
    )
    sections.push(`\n--- Volunteering ---\n${lines.join("\n")}`)
  }

  return sections.join("\n")
}

const linkedInExtractionSchema = z.object({
  profileData: z.object({
    headline: z.string().nullable(),
    currentRole: z.string().nullable(),
    company: z.string().nullable(),
    skills: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
  potentialRecommenders: z.array(
    z.object({
      name: z.string(),
      title: z.string(),
      organization: z.string(),
      relationship: z.string(),
      reasoning: z.string(),
    })
  ),
})

export type LinkedInExtractionResult = z.infer<typeof linkedInExtractionSchema>

/**
 * AI-powered extraction from LinkedIn PDF text.
 * Extracts profile data and identifies potential recommenders.
 */
export async function extractLinkedInProfile(
  text: string
): Promise<LinkedInExtractionResult> {
  const { experimental_output: output } = await generateText({
    model: defaultModel,
    output: Output.object({ schema: linkedInExtractionSchema }),
    prompt: `You are analyzing a LinkedIn profile PDF export for an EB-1A immigration petition.

Extract the following from this LinkedIn profile text:

1. profileData: headline, currentRole, company, skills (list), recommendations (list of recommendation text snippets)
2. potentialRecommenders: People mentioned in the profile who could serve as recommenders. For each, provide name, title, organization, their likely relationship to the profile owner, and reasoning for why they'd be a good EB-1A recommender.

Look for recommenders in: recommendations section, mutual connections mentioned, co-authors, supervisors, collaborators mentioned in experience descriptions.

LinkedIn Profile Text:
${text}`,
  })

  return output!
}
