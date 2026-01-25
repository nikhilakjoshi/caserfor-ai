import { PrismaPg } from "@prisma/adapter-pg"
import { Prisma, PrismaClient } from "@prisma/client"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

type WorkflowSeed = {
  name: string
  description: string
  category: string
  outputType: "draft" | "review_table" | "extraction" | "transformation"
  stepCount?: number
  columnSchema?: object
  promptTemplate: string
  isSystem: boolean
  steps: {
    order: number
    name: string
    action: "input" | "process" | "review" | "output"
    config?: object
  }[]
}

const systemWorkflows: WorkflowSeed[] = [
  // ============================================
  // GENERAL CATEGORY (7 workflows)
  // ============================================
  {
    name: "Draft Client Alert",
    description: "Generate client-facing alerts from source documents",
    category: "General",
    outputType: "draft",
    stepCount: 3,
    promptTemplate: `You are a legal professional drafting a client alert. Based on the provided documents, create a professional client-facing alert that:
1. Summarizes the key developments
2. Explains the implications for clients
3. Provides actionable recommendations

Use clear, accessible language while maintaining legal accuracy.`,
    isSystem: true,
    steps: [
      { order: 1, name: "Upload Documents", action: "input" },
      { order: 2, name: "Extract Key Information", action: "process" },
      { order: 3, name: "Generate Alert Draft", action: "output" },
    ],
  },
  {
    name: "Draft from Template",
    description: "Create documents using predefined templates",
    category: "General",
    outputType: "draft",
    stepCount: 4,
    promptTemplate: `You are a legal drafting assistant. Using the provided template and source documents:
1. Extract relevant information from the source documents
2. Apply the information to the template structure
3. Ensure consistency in terminology and formatting
4. Generate a complete draft document

Maintain the template's structure while customizing content.`,
    isSystem: true,
    steps: [
      { order: 1, name: "Select Template", action: "input" },
      { order: 2, name: "Upload Source Documents", action: "input" },
      { order: 3, name: "Merge and Process", action: "process" },
      { order: 4, name: "Generate Draft", action: "output" },
    ],
  },
  {
    name: "Extract Timeline",
    description: "Pull chronological events from documents",
    category: "General",
    outputType: "extraction",
    columnSchema: {
      columns: ["Date", "Event", "Parties Involved", "Document Source", "Notes"],
    },
    promptTemplate: `You are a legal research assistant creating a timeline. Analyze the provided documents and:
1. Identify all dates and temporal references
2. Extract the events associated with each date
3. Note the parties involved in each event
4. Reference the source document for each entry
5. Add relevant context or notes

Present the timeline in chronological order.`,
    isSystem: true,
    steps: [
      { order: 1, name: "Upload Documents", action: "input" },
      { order: 2, name: "Identify Temporal References", action: "process" },
      { order: 3, name: "Extract and Organize Events", action: "output" },
    ],
  },
  {
    name: "Proofread",
    description: "Check for grammar, style, and consistency issues",
    category: "General",
    outputType: "draft",
    stepCount: 2,
    promptTemplate: `You are a legal proofreader reviewing a document. Check for:
1. Grammar and spelling errors
2. Punctuation issues
3. Style inconsistencies
4. Defined term usage
5. Cross-reference accuracy
6. Formatting consistency

Provide the corrected document with tracked changes or annotations explaining corrections.`,
    isSystem: true,
    steps: [
      { order: 1, name: "Upload Document", action: "input" },
      { order: 2, name: "Review and Correct", action: "output" },
    ],
  },
  {
    name: "Summarize Calls",
    description: "Create summaries from meeting transcripts",
    category: "General",
    outputType: "draft",
    stepCount: 3,
    promptTemplate: `You are a legal assistant summarizing meeting transcripts. Create a summary that includes:
1. Meeting overview (date, participants, purpose)
2. Key discussion points
3. Decisions made
4. Action items with responsible parties
5. Open questions or follow-ups needed

Use professional language and organize by topic.`,
    isSystem: true,
    steps: [
      { order: 1, name: "Upload Transcript", action: "input" },
      { order: 2, name: "Analyze Content", action: "process" },
      { order: 3, name: "Generate Summary", action: "output" },
    ],
  },
  {
    name: "Transcribe Audio",
    description: "Convert audio recordings to text",
    category: "General",
    outputType: "draft",
    stepCount: 2,
    promptTemplate: `You are transcribing legal audio recordings. Produce a transcript that:
1. Identifies speakers when possible
2. Includes timestamps at regular intervals
3. Notes any inaudible sections
4. Preserves the exact wording spoken
5. Uses proper legal terminology

Format the transcript for easy reading and reference.`,
    isSystem: true,
    steps: [
      { order: 1, name: "Upload Audio", action: "input" },
      { order: 2, name: "Transcribe", action: "output" },
    ],
  },
  {
    name: "Translate",
    description: "Translate documents to different languages",
    category: "General",
    outputType: "transformation",
    stepCount: 2,
    promptTemplate: `You are a legal translator. Translate the document while:
1. Preserving legal terminology accuracy
2. Maintaining document structure and formatting
3. Noting any terms that don't have direct equivalents
4. Keeping defined terms consistent
5. Preserving the legal effect of clauses

Provide both the translation and any relevant notes on terminology choices.`,
    isSystem: true,
    steps: [
      { order: 1, name: "Upload Document", action: "input" },
      { order: 2, name: "Translate Content", action: "output" },
    ],
  },

  // ============================================
  // TRANSACTIONAL CATEGORY (5 workflows)
  // ============================================
  {
    name: "Analyze Change of Control",
    description: "Review change of control provisions across agreements",
    category: "Transactional",
    outputType: "review_table",
    columnSchema: {
      columns: [
        "Agreement",
        "Counterparty",
        "Definition",
        "Trigger Events",
        "Notice Requirements",
        "Consent Rights",
        "Cure Period",
        "Notes",
      ],
    },
    promptTemplate: `You are analyzing change of control provisions. For each agreement, extract:
1. How "change of control" is defined
2. What events trigger the provision
3. Notice requirements
4. Whether consent is required
5. Any cure or waiver rights
6. Consequences of triggering

Present findings in a comparative table format.`,
    isSystem: true,
    steps: [
      { order: 1, name: "Upload Agreements", action: "input" },
      { order: 2, name: "Identify Provisions", action: "process" },
      { order: 3, name: "Extract and Compare", action: "process" },
      { order: 4, name: "Generate Review Table", action: "output" },
    ],
  },
  {
    name: "Draft Covenants Memo",
    description: "Summarize covenant provisions from credit agreements",
    category: "Transactional",
    outputType: "draft",
    stepCount: 4,
    promptTemplate: `You are drafting a covenants memo from a credit agreement. Include:
1. Overview of the credit facility
2. Affirmative covenants summary
3. Negative covenants summary
4. Financial covenants with thresholds
5. Reporting requirements
6. Events of default related to covenants

Organize by covenant type and highlight key restrictions.`,
    isSystem: true,
    steps: [
      { order: 1, name: "Upload Credit Agreement", action: "input" },
      { order: 2, name: "Identify Covenants", action: "process" },
      { order: 3, name: "Analyze Terms", action: "process" },
      { order: 4, name: "Draft Memo", action: "output" },
    ],
  },
  {
    name: "Draft Item 1.01",
    description: "Create 8-K Item 1.01 disclosure draft",
    category: "Transactional",
    outputType: "draft",
    stepCount: 3,
    promptTemplate: `You are drafting an 8-K Item 1.01 disclosure for a material definitive agreement. Include:
1. Description of the agreement
2. Material terms
3. Parties to the agreement
4. Conditions to closing
5. Termination provisions
6. Required regulatory approvals

Follow SEC disclosure requirements and typical 8-K formatting.`,
    isSystem: true,
    steps: [
      { order: 1, name: "Upload Transaction Documents", action: "input" },
      { order: 2, name: "Extract Material Terms", action: "process" },
      { order: 3, name: "Draft Disclosure", action: "output" },
    ],
  },
  {
    name: "Extract Key Data",
    description: "Pull structured data from agreements",
    category: "Transactional",
    outputType: "extraction",
    columnSchema: {
      columns: [
        "Agreement Type",
        "Parties",
        "Effective Date",
        "Term",
        "Governing Law",
        "Jurisdiction",
        "Assignment",
        "Termination",
        "Indemnification Cap",
        "Limitation of Liability",
        "Confidentiality Period",
        "Notes",
      ],
    },
    promptTemplate: `You are extracting key data points from agreements. For each document, identify:
1. Agreement type and title
2. Parties and their roles
3. Effective date and term
4. Governing law and jurisdiction
5. Assignment restrictions
6. Termination provisions
7. Liability and indemnification terms
8. Confidentiality provisions

Present in structured table format.`,
    isSystem: true,
    steps: [
      { order: 1, name: "Upload Agreements", action: "input" },
      { order: 2, name: "Parse Documents", action: "process" },
      { order: 3, name: "Extract Data Points", action: "output" },
    ],
  },
  {
    name: "Extract Terms from Agreements",
    description: "Identify and extract key terms and definitions",
    category: "Transactional",
    outputType: "review_table",
    columnSchema: {
      columns: [
        "Term",
        "Definition",
        "Agreement",
        "Section Reference",
        "Cross-References",
        "Notes",
      ],
    },
    promptTemplate: `You are extracting defined terms from agreements. For each agreement:
1. Identify all defined terms
2. Extract the full definition
3. Note the section where defined
4. Identify cross-references to the term
5. Flag any inconsistencies across documents

Present in alphabetical order by term.`,
    isSystem: true,
    steps: [
      { order: 1, name: "Upload Agreements", action: "input" },
      { order: 2, name: "Identify Definitions", action: "process" },
      { order: 3, name: "Extract Terms", action: "output" },
    ],
  },
]

async function main() {
  console.log("Seeding database with system workflows...")

  for (const workflow of systemWorkflows) {
    const { steps, ...workflowData } = workflow

    // Upsert workflow by name (to allow re-running seed)
    const created = await prisma.workflow.upsert({
      where: {
        // Use a composite approach since name isn't unique in schema
        // For seeding, we'll delete+create if name matches
        id: `system-${workflow.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: {
        ...workflowData,
        columnSchema: workflowData.columnSchema ?? Prisma.DbNull,
        stepCount: workflowData.stepCount ?? null,
        steps: {
          deleteMany: {},
          create: steps.map((step) => ({
            ...step,
            config: step.config ?? {},
          })),
        },
      },
      create: {
        id: `system-${workflow.name.toLowerCase().replace(/\s+/g, "-")}`,
        ...workflowData,
        columnSchema: workflowData.columnSchema ?? Prisma.DbNull,
        stepCount: workflowData.stepCount ?? null,
        steps: {
          create: steps.map((step) => ({
            ...step,
            config: step.config ?? {},
          })),
        },
      },
    })

    console.log(`  Created workflow: ${created.name}`)
  }

  console.log(`\nSeeded ${systemWorkflows.length} system workflows.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error("Seed error:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
