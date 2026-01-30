export interface SubQuestion {
  key: string
  label: string
  type: "text" | "textarea" | "number" | "boolean"
  placeholder?: string
}

export interface CriterionConfig {
  slug: string
  label: string
  description: string
  questions: SubQuestion[]
}

export const CRITERIA_QUESTIONS: CriterionConfig[] = [
  {
    slug: "awards",
    label: "Awards",
    description: "Major nationally or internationally recognized prizes or awards",
    questions: [
      { key: "awardNames", label: "List your major awards or prizes", type: "textarea", placeholder: "e.g. Nobel Prize, Pulitzer, industry-specific awards..." },
      { key: "awardingBodies", label: "Awarding organizations", type: "textarea", placeholder: "Names of the organizations that granted these awards" },
      { key: "selectionCriteria", label: "Selection criteria or process", type: "textarea", placeholder: "How were recipients selected? How competitive was it?" },
      { key: "numberOfRecipients", label: "Approximate number of recipients per year", type: "text", placeholder: "e.g. 1, 5, 10" },
    ],
  },
  {
    slug: "membership",
    label: "Membership",
    description: "Membership in associations requiring outstanding achievements",
    questions: [
      { key: "associations", label: "List associations or organizations", type: "textarea", placeholder: "Names of professional associations you belong to" },
      { key: "requirements", label: "Membership requirements", type: "textarea", placeholder: "What achievements are required for admission?" },
      { key: "memberCount", label: "Total membership size", type: "text", placeholder: "Approximate number of members" },
    ],
  },
  {
    slug: "press",
    label: "Press",
    description: "Published material about you in professional or major media",
    questions: [
      { key: "publications", label: "Publications that featured you", type: "textarea", placeholder: "e.g. New York Times, Nature, industry journals..." },
      { key: "articleTopics", label: "What were the articles about?", type: "textarea", placeholder: "Briefly describe the coverage" },
      { key: "hasLinks", label: "Do you have links or copies?", type: "boolean" },
    ],
  },
  {
    slug: "judging",
    label: "Judging",
    description: "Participation as a judge of the work of others",
    questions: [
      { key: "judgingRoles", label: "Describe your judging roles", type: "textarea", placeholder: "e.g. peer reviewer, competition judge, grant evaluator..." },
      { key: "organizations", label: "Organizations you judged for", type: "textarea", placeholder: "Names of journals, competitions, panels" },
      { key: "frequency", label: "How often do you judge?", type: "text", placeholder: "e.g. annually, ongoing" },
    ],
  },
  {
    slug: "original-contribution",
    label: "Original Contribution",
    description: "Original contributions of major significance to the field",
    questions: [
      { key: "contributions", label: "Describe your key contributions", type: "textarea", placeholder: "What have you created, invented, or discovered?" },
      { key: "significance", label: "Why are these significant?", type: "textarea", placeholder: "Impact on the field, adoption by others, citations..." },
      { key: "recognition", label: "How has the field recognized these?", type: "textarea", placeholder: "Awards, citations, adoption, media coverage..." },
    ],
  },
  {
    slug: "scholarly-articles",
    label: "Scholarly Articles",
    description: "Authorship of scholarly articles in professional journals",
    questions: [
      { key: "publicationCount", label: "Number of publications", type: "number", placeholder: "Total count" },
      { key: "topPublications", label: "List your top publications", type: "textarea", placeholder: "Title, journal, year for your most significant works" },
      { key: "citations", label: "Total citation count (if known)", type: "text", placeholder: "e.g. 500, 1000+" },
      { key: "hIndex", label: "H-index (if known)", type: "text", placeholder: "e.g. 15" },
    ],
  },
  {
    slug: "exhibitions",
    label: "Exhibitions",
    description: "Display of work at artistic exhibitions or showcases",
    questions: [
      { key: "exhibitions", label: "List exhibitions or showcases", type: "textarea", placeholder: "Name, venue, date of exhibitions" },
      { key: "prestige", label: "Prestige of venues", type: "textarea", placeholder: "Why are these venues significant?" },
    ],
  },
  {
    slug: "leading-role",
    label: "Leading Role",
    description: "Leading or critical role in distinguished organizations",
    questions: [
      { key: "roles", label: "Describe your leadership roles", type: "textarea", placeholder: "Title, organization, responsibilities" },
      { key: "orgDistinction", label: "Why is the organization distinguished?", type: "textarea", placeholder: "Revenue, reputation, impact, rankings..." },
      { key: "yourImpact", label: "What was your specific impact?", type: "textarea", placeholder: "Measurable outcomes, growth, changes you drove" },
    ],
  },
  {
    slug: "high-salary",
    label: "High Salary",
    description: "High salary or remuneration relative to others in the field",
    questions: [
      { key: "currentCompensation", label: "Current total compensation (USD)", type: "text", placeholder: "e.g. $250,000" },
      { key: "fieldMedian", label: "Median salary in your field (if known)", type: "text", placeholder: "e.g. $80,000" },
      { key: "evidence", label: "Evidence of above-market pay", type: "textarea", placeholder: "Offer letters, pay stubs, comparison data" },
    ],
  },
  {
    slug: "commercial-success",
    label: "Commercial Success",
    description: "Evidence of commercial successes in the performing arts",
    questions: [
      { key: "successes", label: "Describe your commercial successes", type: "textarea", placeholder: "Box office, sales, revenue, ticket sales..." },
      { key: "metrics", label: "Key metrics", type: "textarea", placeholder: "Numbers that demonstrate commercial impact" },
    ],
  },
]
