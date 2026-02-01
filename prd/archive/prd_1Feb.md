# PRD: EB1A Client Onboarding & Eligibility Assessment

## Overview

Client onboarding journey for immigration law firms. Multi-step intake form captures applicant background, EB1A criterion evidence, and supporting documents. On submission, an AI agent evaluates eligibility across all 10 EB1A criteria and produces a per-criterion breakdown + overall verdict.

## Goals

- Capture comprehensive EB1A intake data via multi-step form at `/onboarding`
- Allow document uploads (resume, awards, articles, etc.) during intake
- Auto-create a vault per client for document storage + RAG
- Run AI eligibility assessment post-submission: per-criterion scores + overall verdict
- Save progress (draft state) so users can return later

## Non-goals

- Real auth (continues using MOCK_USER_ID)
- AI assistance within the form (future phase)
- Payment/billing integration
- Email notifications
- Client portal / applicant self-service

---

## Database Schema Changes

`prisma/schema.prisma` -- add 2 enums + 3 models, modify Vault:

```prisma
enum IntakeStatus {
  draft
  submitted
  under_review
  reviewed
}

enum EligibilityVerdict {
  strong
  moderate
  weak
  insufficient
}

model Client {
  id             String       @id @default(cuid())

  // Background
  firstName      String?
  lastName       String?
  email          String?
  phone          String?
  dateOfBirth    DateTime?
  countryOfBirth String?
  citizenship    String?
  fieldOfExpertise String?
  subfield       String?
  education      Json?        // [{degree, institution, year, country}]
  currentTitle   String?
  currentEmployer String?
  yearsExperience Int?
  careerProgression String?  @db.Text

  // US Intent
  continueInFieldUS Boolean?
  workTypePlanned   String?
  hasJobOffer       Boolean?
  jobOfferDetails   String?  @db.Text
  businessPlan      String?  @db.Text
  benefitToUS       String?  @db.Text
  plannedMoveDate   DateTime?

  // Major Achievement
  hasMajorAchievement Boolean?
  majorAchievementDetails String? @db.Text

  // Impact & Recognition
  socialFollowing    String?  @db.Text
  keynotes           String?  @db.Text
  collaborations     String?  @db.Text
  peerRecognition    String?  @db.Text

  // Recommendation Letters
  potentialRecommenders Json?  // [{name, title, org, relationship}]
  hasExistingLetters    Boolean?

  // Current Standing
  selfAssessment         String?  @db.Text
  recentAccomplishments  String?  @db.Text
  standingLevel          String?  // top_1, top_5, top_10, above_average
  recognitionScope       String?  // local, regional, national, international

  // Documentation Availability
  availableEvidence  Json?    // checklist of what they have

  // Timeline
  urgency             String?
  idealSubmissionDate DateTime?
  willingnessToGather Boolean?
  priorConsultations  String?  @db.Text
  priorVisas          String?  @db.Text
  priorEB1AFiling     Boolean?

  // Alternative Categories
  hasSponsor         Boolean?
  teachingExperience Boolean?
  considerEB1B       Boolean?
  considerEB2NIW     Boolean?
  hasAdvancedDegree  Boolean?

  // Meta
  currentStep  Int          @default(1)
  status       IntakeStatus @default(draft)
  vaultId      String?      @unique
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  vault              Vault?              @relation(fields: [vaultId], references: [id])
  criterionResponses CriterionResponse[]
  eligibilityReport  EligibilityReport?

  @@map("clients")
}

model CriterionResponse {
  id        String @id @default(cuid())
  clientId  String
  criterion String // slug from document-categories.ts
  responses Json   // flexible key-value per criterion's sub-questions
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@unique([clientId, criterion])
  @@index([clientId])
  @@map("criterion_responses")
}

model EligibilityReport {
  id        String             @id @default(cuid())
  clientId  String             @unique
  verdict   EligibilityVerdict
  summary   String             @db.Text
  criteria  Json               // {slug: {score: 1-5, analysis: string, evidenceRefs: string[]}}
  rawOutput String?            @db.Text
  createdAt DateTime           @default(now())

  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@map("eligibility_reports")
}
```

Add to existing Vault model: `client Client?` (optional back-relation).

**Required fields** (minimum to submit): `firstName`, `lastName`, `email`, `fieldOfExpertise`. Everything else optional -- less data just means weaker assessment.

---

## Form Steps (19 survey sections -> 6 steps)

| Step | Label | Survey Sections | Key Fields |
|------|-------|----------------|------------|
| 1 | Personal Background | S1 + S2 | Name*, email*, DOB, citizenship, education, employer, field*, US intent |
| 2 | Major Achievement | S3 | Nobel/Pulitzer/Oscar/Olympic or similar |
| 3 | EB1A Criteria | S4-S13 | 10 criteria as vertical tabs. Each has sub-questions stored as CriterionResponse |
| 4 | Impact & Standing | S14-S16 | Social, keynotes, recommenders, self-assessment |
| 5 | Documents & Timeline | S17-S19 | Evidence checklist, urgency, alt categories, file uploads |
| 6 | Review & Submit | -- | Summary of all data, trigger submission |

Step 3 uses vertical tabs (desktop) / accordion (mobile) for the 10 criteria. Sub-questions per criterion defined in `criteria-questions.ts`.

Step 5 includes the file upload dropzone (reusing existing react-dropzone + S3 patterns).

---

## UI Architecture

### Route structure
```
app/onboarding/
  layout.tsx                -- minimal layout, logo, no sidebar
  page.tsx                  -- loads draft, redirects to current step
  steps/[step]/page.tsx     -- renders step component by param (1-6)
  _components/
    onboarding-shell.tsx    -- progress bar, step nav, auto-save indicator
    step-personal.tsx
    step-achievement.tsx
    step-criteria.tsx       -- renders criteria-tab for each criterion
    criteria-tab.tsx        -- single criterion sub-form
    step-impact.tsx
    step-docs-timeline.tsx  -- uploads + timeline + alt categories
    step-review.tsx         -- summary + submit button
    review-summary.tsx      -- post-submit: shows eligibility report
  _lib/
    onboarding-schema.ts    -- zod schemas per step
    use-onboarding.ts       -- hook: load/save draft, manage step transitions
    criteria-questions.ts   -- sub-question defs per criterion slug
```

### Form state
- `react-hook-form` + `@hookform/resolvers/zod` per step
- `use-onboarding` hook: fetches draft on mount, PATCH on step transition, debounced auto-save every 30s
- `currentStep` stored on Client model for resume

### New dependencies
- `react-hook-form`
- `@hookform/resolvers`

---

## API Routes

```
app/api/onboarding/
  draft/route.ts                          -- GET: fetch/create draft Client + vault
                                          -- PATCH: update Client fields
  [clientId]/
    criteria/route.ts                     -- GET: all CriterionResponses
                                          -- PUT: upsert single criterion
    upload/route.ts                       -- POST: upload files to client vault
    submit/route.ts                       -- POST: set status=submitted, run eval
    report/route.ts                       -- GET: fetch EligibilityReport
```

### Draft flow
1. `GET /api/onboarding/draft` -- finds `Client` with `status=draft`, or creates new + auto-creates vault "Intake - {firstName} {lastName} - {date}"
2. Each step calls `PATCH /api/onboarding/draft` with step fields
3. Step 3 uses `PUT /api/onboarding/[id]/criteria` per criterion
4. Step 5 uploads via `POST /api/onboarding/[id]/upload` (reuses S3 + embedding pipeline from existing vault upload route)
5. Step 6 calls `POST /api/onboarding/[id]/submit`

---

## EB1A Eligibility Agent

### Trigger
`POST /api/onboarding/[clientId]/submit` sets status to `under_review`, then runs agent.

### Agent setup
Uses `gemini-2.5-pro` (deep analysis) via existing `ToolLoopAgent` pattern.

**Tools**:
- `search_evidence` -- RAG over client's vault (wraps `queryPinecone` scoped to vault namespace)
- `get_intake_data` -- fetches Client + CriterionResponse[] from DB

**System prompt** instructs:
1. Review all 10 EB1A criteria against USCIS standards
2. Score each criterion 1-5 (1=no evidence, 5=very strong)
3. Cross-reference uploaded docs via search_evidence
4. Overall verdict: 3+ criteria at >=3 -> moderate, 3+ at >=4 -> strong
5. Flag EB1B/EB2-NIW alternatives if applicable
6. Output structured JSON

### Output
Parsed into `EligibilityReport` model. Client polls `GET /api/onboarding/[clientId]/report` until available (status changes from `under_review` to `reviewed`).

### New file
`lib/eb1a-evaluator.ts` -- system prompt + tool definitions + evaluation runner

---

## Critical files to modify/reference

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add Client, CriterionResponse, EligibilityReport models |
| `lib/document-categories.ts` | Reference EB1A criterion slugs |
| `app/api/vaults/[id]/documents/route.ts` | Reuse upload pattern |
| `lib/agent-tools.ts` | Pattern for agent tool creation |
| `lib/rag.ts` | RAG query for evidence search tool |

---

## Verification

1. Create draft: visit /onboarding, verify Client + Vault created in DB
2. Fill steps 1-5, navigate back/forward, verify data persists
3. Upload 2+ docs in step 5, verify S3 upload + embedding triggered
4. Submit in step 6, verify agent runs and EligibilityReport created
5. Review page shows per-criterion scores + verdict
6. Refresh mid-form, verify resume to correct step

---

## Unresolved Questions

- Step 3 criteria UI: vertical tabs vs accordion vs card grid?
- Should eval be streaming SSE or async poll?
- Auto-categorize uploaded docs (existing `categorize-document.ts`) or manual?
- Single flat Client table (above) vs normalized sub-tables?
