# PRD: Onboarding Revamp, Vault Integration, Lawyer Dashboard & Auth

## Overview

Transform the existing EB1A evaluation platform from a single-user prototype into a multi-role production system. Key changes: restructured onboarding with resume-first flow and AI pre-population, document vault integration throughout, lawyer dashboard with case management and gap analysis, document classification agent, and real authentication with roles.

**Updated User Flow:**
- Applicant: Landing (`/`) -> Onboarding (`/onboarding`) -> Evaluation (`/evaluation/[clientId]`) -> Payment -> Assistant (`/assistant`) w/ vault access
- Lawyer: Login -> Dashboard (`/lawyer`) -> Case detail (`/lawyer/cases/[clientId]`) -> Vault + Gap Analysis

---

## Goals

- Restructure onboarding into 9 sections per spec, with resume-first flow that pre-populates fields via AI
- Connect onboarding data + uploads to per-applicant vault, accessible from assistant post-payment
- Build lawyer dashboard: self-assign cases, view vault/docs, see gap analysis with AI recommendations
- Add "start over" to onboarding with confirmation dialog
- Implement document classification agent on every upload
- Add auth with roles (applicant, lawyer, admin)
- Use react-dropzone for all file uploads

## Non-goals

- Real-time collaboration between lawyer and applicant
- Billing/subscription management for lawyers
- Mobile app
- Email notification system (future)
- Workflow builder UI

---

## User Stories

**Applicant:**
- Upload resume first, see onboarding fields pre-populated, verify/correct each step
- Start over mid-onboarding if needed (with confirmation)
- After payment, access assistant with my vault containing all uploaded docs
- Upload documents at any step, have them auto-classified

**Lawyer:**
- Log in, see dashboard of unassigned cases + my assigned cases
- Self-assign unassigned cases
- Click a case -> see applicant's vault, documents, and gap analysis
- Gap analysis shows per-criterion strength, doc coverage, and AI recommendations for weak areas

---

## Functional Requirements

### 1. Authentication & Roles

**Implementation:** NextAuth.js (or Clerk -- TBD based on speed preference)

**Roles:**
- `applicant` - onboarding flow, assistant, own vault only
- `lawyer` - lawyer dashboard, assigned cases' vaults, gap analysis
- `admin` - all access (future, minimal for now)

**Schema changes to `User` model:**
```
role    UserRole  @default(applicant)  // enum: applicant, lawyer, admin
```

**Schema: new `CaseAssignment` model:**
```
CaseAssignment {
  id        String   @id @default(cuid())
  clientId  String
  lawyerId  String
  assignedAt DateTime @default(now())
  client    Client   @relation(fields: [clientId], references: [id])
  lawyer    User     @relation(fields: [lawyerId], references: [id])
  @@unique([clientId])  // one lawyer per case
}
```

**Files to modify:**
- `prisma/schema.prisma` - add `UserRole` enum, `role` field on User, `CaseAssignment` model
- Replace all `MOCK_USER_ID` usage with session user ID
- Add middleware or layout-level auth checks

**Files to create:**
- `lib/auth.ts` - NextAuth config
- `app/api/auth/[...nextauth]/route.ts`
- `middleware.ts` - route protection

---

### 2. Onboarding Restructure (9 Sections)

Restructure the current 6-step flow into 9 sections. The new step mapping:

| New Section | Content | Current Code |
|---|---|---|
| 1. Getting Started | Welcome + Basic Info | Partial in step-personal |
| 2. Resume Upload | Upload resume, AI parses & pre-populates | NEW |
| 3. Background & Eligibility | Citizenship, applicant type, criteria selection | Partial in step-personal + step-criteria |
| 4. Evidence Collection | Dynamic per-criterion fields | step-criteria (restructure) |
| 5. Immigration Status | Visa, I-140, issues, criminal record | NEW |
| 6. Personal Circumstances | Dependents, deadlines | NEW |
| 7. Supporting Documents | Additional doc uploads | step-docs-timeline (partial) |
| 8. Preferences & Attribution | Lawyer prefs, referral source, social | NEW |
| 9. Review & Submit | Summary + submit | step-review (adapt) |

**Key changes to existing components:**

`app/onboarding/_lib/onboarding-schema.ts` - Expand Zod schema to include all new fields:
- Section 1: consent checkboxes (texts, marketing, terms)
- Section 3: applicantType enum, country of citizenship as multi-select
- Section 5: currentVisaStatus, visaExpiration, otherVisas, i140Status, priorImmigrationIssues, criminalRecord
- Section 6: hasDependents, dependentsInfo, hasDeadlines
- Section 7: (file uploads handled via vault, not form fields)
- Section 8: lawyerPreferences, referralSource, socialPlatform, followerCount, profileLink
- Section 9: anythingElse text, additional file upload

`prisma/schema.prisma` - Add corresponding fields to `Client` model.

**New step components** in `app/onboarding/_components/`:
- `step-welcome.tsx` - Value props + start button
- `step-basic-info.tsx` - Name, email, phone, consent
- `step-resume-upload.tsx` - Dropzone for resume, processing indicator, skip option
- `step-background.tsx` - Citizenship, applicant type, criteria checkboxes
- `step-evidence.tsx` - Dynamic criteria evidence (refactor from step-criteria)
- `step-immigration.tsx` - Visa status, I-140, issues
- `step-circumstances.tsx` - Dependents, deadlines
- `step-documents.tsx` - Additional supporting docs upload
- `step-preferences.tsx` - Lawyer prefs, referral, social
- `step-review.tsx` - Review all (adapt existing)

**Files to modify:**
- `app/onboarding/page.tsx` - Update step count (6 -> 10 screens including welcome), step routing
- `app/onboarding/_lib/use-onboarding.ts` - Update step management, add resume pre-population merge logic
- `app/onboarding/_lib/onboarding-schema.ts` - Expand schema
- `app/onboarding/_lib/criteria-questions.ts` - Restructure to match new evidence collection fields per spec

---

### 3. Resume Upload & AI Pre-Population Agent

**Flow:**
1. After welcome screen, applicant sees dedicated resume upload screen
2. Upload via react-dropzone (PDF, DOC, DOCX - max 20MB)
3. File stored in applicant's vault via existing upload pipeline
4. Simultaneously, resume parsing agent extracts structured data
5. Pre-populated fields shown with confidence indicators
6. Applicant proceeds through steps, verifying/correcting pre-filled data

**Resume Parsing Agent** (`lib/resume-parser.ts`):
- Input: extracted text from resume (reuse `extractText()` from `lib/document-parser.ts`)
- Model: `gemini-2.5-flash` for speed
- Output: JSON matching onboarding schema fields + confidence per field (0-1)
- Fields to extract:
  - firstName, lastName, email, phone
  - citizenship (infer from education/work locations)
  - fieldOfExpertise, currentEmployer
  - education array (institution, degree, year)
  - Work history -> potential criteria evidence
  - Publications -> scholarly articles
  - Awards/honors -> awards criterion
  - Professional memberships -> membership criterion

**Confidence display:**
- High confidence (>0.8): normal field styling, small checkmark
- Medium confidence (0.5-0.8): light yellow/amber background
- Low confidence (<0.5): orange background, "Please verify" label

**API endpoint:** `POST /api/onboarding/[clientId]/parse-resume`
- Accepts file or documentId
- Returns `{ fields: Record<string, any>, confidence: Record<string, number> }`
- Stores parsed data in client record

**Files to create:**
- `lib/resume-parser.ts` - AI parsing logic
- `app/api/onboarding/[clientId]/parse-resume/route.ts`
- `app/onboarding/_components/step-resume-upload.tsx`

---

### 4. Start Over Button

**Location:** Persistent in onboarding header/nav area (visible on all steps except welcome)

**Behavior:**
1. Click "Start Over" -> confirmation dialog appears
2. Dialog: "This will delete all your progress including uploaded documents. Are you sure?"
3. Confirm -> API call to reset
4. Cancel -> dismiss dialog

**API endpoint:** `POST /api/onboarding/[clientId]/reset`
- Deletes all `CriterionResponse` records for client
- Deletes all `Document` records in client's vault (+ S3 files + Pinecone vectors)
- Resets all client fields to null/defaults
- Resets `currentStep` to 1
- Resets `status` to `draft`
- Returns `{ success: true }`

**Files to create:**
- `app/api/onboarding/[clientId]/reset/route.ts`

**Files to modify:**
- `app/onboarding/page.tsx` - Add start over button in header area + confirmation dialog

---

### 5. Document Classification Agent

**Already partially implemented** in `lib/categorize-document.ts`. Current system:
- 18 categories (10 EB1A evidence + 8 general legal)
- Uses Gemini 2.5-flash
- Runs during document processing pipeline

**Changes needed:**
- Ensure classification runs on EVERY upload path (onboarding uploads, vault uploads, assistant uploads)
- Verify onboarding upload path (`/api/onboarding/[clientId]/upload`) triggers processing pipeline (currently it does call process endpoint)
- Add categories for resume-specific docs not in current list:
  - `resume-cv` - Resumes and CVs
  - `recommendation-letter` - Letters of recommendation
  - `employment-verification` - Employment verification letters
  - `identity-document` - Passport, ID copies
  - `immigration-document` - Visa copies, I-140 receipts, prior petitions

**Updated category list (23 total):**
```
EB-1A Evidence (10): awards, membership, press, judging, original-contribution,
  scholarly-articles, exhibitions, leading-role, high-salary, commercial-success

Supporting Documents (5): resume-cv, recommendation-letter, employment-verification,
  identity-document, immigration-document

General Legal (8): contract, template, memo, policy, research, financial,
  correspondence, other
```

**Files to modify:**
- `lib/document-categories.ts` - Add 5 new categories
- `lib/categorize-document.ts` - Update prompt with new categories
- Vault UI category dropdown - auto-updates if it reads from `document-categories.ts`

---

### 6. Vault Integration: Onboarding -> Assistant

**Current state:** Vault is created per client during onboarding draft. Documents uploaded during onboarding go to this vault.

**Required changes:**

**Applicant assistant view (`/assistant`):**
- After payment, applicant lands on assistant page
- Assistant should auto-select/show only the applicant's vault
- Hide vault creation/selection UI for applicants (they have one vault)
- Existing assistant already supports vault-scoped queries via Pinecone namespace

**Files to modify:**
- `app/(dashboard)/assistant/page.tsx` - For applicant role: auto-load their vault, hide multi-vault UI
- `app/(dashboard)/vault/[id]/page.tsx` - For applicant role: read-only or scoped access

**API changes:**
- `GET /api/vaults` - Filter by user role: applicants see only their vault, lawyers see assigned clients' vaults

---

### 7. Lawyer Dashboard

**New routes:**

**`/lawyer` - Dashboard (case list)**
- Two tabs: "My Cases" and "Unassigned"
- Each case card shows: applicant name, submission date, evaluation verdict, criteria count, status badge
- "Unassigned" tab: cases with status `paid` and no `CaseAssignment`
- "Assign to Me" button on unassigned cases
- Click case -> `/lawyer/cases/[clientId]`

**`/lawyer/cases/[clientId]` - Case Detail**
- Three sub-views (tabs or sidebar nav):
  1. **Vault** - Reuse existing vault UI (`components/vault/`), scoped to client's vault
  2. **Gap Analysis** - New component (see below)
  3. **Assistant** - Reuse assistant UI, scoped to client's vault

**Gap Analysis View** (`/lawyer/cases/[clientId]/gap-analysis`):

Display per-criterion:
- Strength level: strong / moderate / weak / no evidence (color-coded)
- Document count per criterion (from document classification)
- AI confidence score
- Summary from EligibilityReport criteria JSON

Plus:
- Overall verdict banner
- AI-generated recommendations for weak/missing criteria (what evidence to gather)
- "Refresh Analysis" button to re-run evaluator

**API endpoints:**
- `GET /api/lawyer/cases` - List cases (assigned + unassigned)
- `POST /api/lawyer/cases/[clientId]/assign` - Self-assign
- `GET /api/lawyer/cases/[clientId]/gap-analysis` - Get gap analysis data
- `POST /api/lawyer/cases/[clientId]/gap-analysis/refresh` - Re-run evaluation

**Gap analysis data structure:**
```typescript
{
  verdict: "strong" | "moderate" | "weak" | "insufficient",
  summary: string,
  criteria: Array<{
    name: string,
    strength: "strong" | "moderate" | "weak" | "none",
    confidence: number,
    documentCount: number,
    documents: Array<{ id: string, name: string, category: string }>,
    analysis: string,
    recommendations: string[]  // AI-generated next steps
  }>,
  overallRecommendations: string[]
}
```

**Files to create:**
- `app/(lawyer)/layout.tsx` - Lawyer layout with nav
- `app/(lawyer)/lawyer/page.tsx` - Case list dashboard
- `app/(lawyer)/lawyer/cases/[clientId]/page.tsx` - Case detail
- `app/(lawyer)/lawyer/cases/[clientId]/gap-analysis/page.tsx` - Gap analysis view
- `app/api/lawyer/cases/route.ts` - List cases
- `app/api/lawyer/cases/[clientId]/assign/route.ts` - Self-assign
- `app/api/lawyer/cases/[clientId]/gap-analysis/route.ts` - Gap analysis data
- `lib/gap-analysis.ts` - Gap analysis generation logic (extends eb1a-evaluator)

---

### 8. react-dropzone Standardization

Already used in step-docs-timeline and vault page. Ensure all new upload points use it:
- `step-resume-upload.tsx` - Resume upload
- `step-documents.tsx` - Supporting docs
- `step-review.tsx` - "Anything else" file upload
- Any lawyer-side upload capability

Create a shared dropzone component if one doesn't exist:

**File to create:**
- `components/ui/file-dropzone.tsx` - Reusable wrapper around react-dropzone with consistent styling, file type validation, size limits, progress indicator

---

## Technical Considerations

### Architecture
- Next.js App Router with route groups: `(dashboard)` for applicant, `(lawyer)` for lawyer
- Prisma ORM, PostgreSQL
- Google AI (Gemini) for all AI tasks
- Pinecone for vector search, S3 for file storage
- Existing patterns: react-hook-form + Zod, Radix UI, Tailwind, Lucide icons

### Key existing files to build on
- Onboarding schema: `app/onboarding/_lib/onboarding-schema.ts`
- Onboarding hook: `app/onboarding/_lib/use-onboarding.ts`
- Document processing: `app/api/vaults/[id]/documents/process/route.ts`
- Document categorization: `lib/categorize-document.ts`, `lib/document-categories.ts`
- EB1A evaluator: `lib/eb1a-evaluator.ts`
- AI config: `lib/ai.ts`
- Text extraction: `lib/document-parser.ts`
- S3: `lib/s3.ts`
- Pinecone: `lib/pinecone.ts`

### Migration path
- Add new fields to Client model (nullable for backward compat)
- Add UserRole enum, CaseAssignment model
- Run `npx prisma migrate dev`
- Incremental deployment: auth first, then onboarding restructure, then lawyer dashboard

---

## Edge Cases & Error Handling

- Resume parsing fails: show error toast, allow skip to manual entry
- Resume too large: reject at dropzone level (20MB limit)
- Resume has no extractable text (scanned image PDF): show message suggesting re-upload with text-based PDF
- Start over while documents are processing: cancel processing, then delete
- Lawyer tries to access unassigned case: 403
- Applicant tries to access lawyer routes: redirect to `/assistant`
- Gap analysis with no evaluation report: prompt to run evaluation first
- Multiple lawyers try to assign same case simultaneously: DB unique constraint on CaseAssignment.clientId handles race condition
- Pre-populated field overwritten by user then resume re-uploaded: user edits take precedence, don't overwrite

---

## Open Questions

- NextAuth vs Clerk for auth? Clerk faster to ship, NextAuth more flexible
- Should lawyers be able to unassign themselves from a case?
- Gap analysis recommendations -- use gemini-2.5-pro or flash?
- Should applicant see gap analysis too (post-payment) or lawyer-only?
- LinkedIn URL parsing for resume alternative -- build now or later?
- Max cases per lawyer limit?
- Should "start over" require email re-verification?
