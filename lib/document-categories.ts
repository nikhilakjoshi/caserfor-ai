export interface DocumentCategory {
  slug: string
  label: string
  description: string
}

// 10 EB1A evidence categories + 8 general legal categories
export const DOCUMENT_CATEGORIES = [
  // EB1A evidence categories
  { slug: "awards", label: "Awards", description: "Major prizes or awards for outstanding achievement" },
  { slug: "membership", label: "Membership", description: "Membership in associations requiring outstanding achievement" },
  { slug: "press", label: "Press", description: "Published material about the person in professional media" },
  { slug: "judging", label: "Judging", description: "Participation as a judge of others' work in the field" },
  { slug: "original-contribution", label: "Original Contribution", description: "Original scientific, scholarly, or business contributions of major significance" },
  { slug: "scholarly-articles", label: "Scholarly Articles", description: "Authorship of scholarly articles in the field" },
  { slug: "exhibitions", label: "Exhibitions", description: "Display of work at artistic exhibitions or showcases" },
  { slug: "leading-role", label: "Leading Role", description: "Evidence of a leading or critical role in distinguished organizations" },
  { slug: "high-salary", label: "High Salary", description: "Evidence of high salary or remuneration relative to others in the field" },
  { slug: "commercial-success", label: "Commercial Success", description: "Evidence of commercial successes in the performing arts" },
  // General legal categories
  { slug: "contract", label: "Contract", description: "Contracts, agreements, and binding legal documents" },
  { slug: "template", label: "Template", description: "Document templates and standard forms" },
  { slug: "memo", label: "Memo", description: "Legal memoranda and internal communications" },
  { slug: "policy", label: "Policy", description: "Policy documents and compliance materials" },
  { slug: "research", label: "Research", description: "Research papers, briefs, and analytical documents" },
  { slug: "financial", label: "Financial", description: "Financial statements, reports, and records" },
  { slug: "correspondence", label: "Correspondence", description: "Letters, emails, and formal communications" },
  { slug: "other", label: "Other", description: "Documents not fitting other categories" },
] as const satisfies readonly DocumentCategory[]

export type DocumentCategorySlug = (typeof DOCUMENT_CATEGORIES)[number]["slug"]

export const CATEGORY_SLUGS = DOCUMENT_CATEGORIES.map((c) => c.slug)

export function getCategoryLabel(slug: string): string {
  const cat = DOCUMENT_CATEGORIES.find((c) => c.slug === slug)
  return cat?.label ?? slug
}
