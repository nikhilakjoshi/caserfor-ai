# PRD: Recommender Management, Smart Ingestion & Document Drafting

## Overview

Three interconnected features that take a case from evaluated to petition-ready: (A) manage recommenders with AI-powered suggestions, (B) silently classify every uploaded doc and extract recommender candidates from LinkedIn PDFs, (C) dedicated two-panel drafting workspace for all 7 EB1A document types with specialized AI agents.

**Depends on:** Existing Client model, Vault/RAG pipeline, Gap Analysis, EligibilityReport, document processing endpoint.

---

## Goals

- Let lawyers and applicants build a recommender roster with AI-suggested candidates based on profile + evidence
- Silently classify every uploaded document; auto-extract recommender candidates from LinkedIn PDFs
- Provide a structured drafting workspace for all 7 petition document types with AI generation, per-section regeneration, and version history
- Keep all new features scoped to existing client/case context

## Non-goals

- E-signature or recommender portal (recommenders don't log in)
- Real-time co-editing between lawyer and applicant on drafts
- Automated USCIS filing or e-filing integration
- Email/SMS notifications to recommenders (future)
- Template marketplace

---

## User Stories

**Applicant:**
- View AI-suggested recommender roles based on my profile and evidence
- Add recommenders I know, upload their CV/bio, track status
- Access drafting workspace for personal statement
- Review lawyer-generated drafts in editor

**Lawyer:**
- See AI-suggested recommender types with reasoning and criteria coverage
- Manage full recommender pipeline: identify -> contact -> confirm -> draft letter -> finalize
- Generate any of 7 document types using AI with full case context
- Edit AI-generated drafts in rich text editor, regenerate individual sections
- Track draft status and version history across all document types

---

## A. Recommender Management

### Data Models

```prisma
enum RecommenderStatus {
  suggested
  identified
  contacted
  confirmed
  letter_drafted
  letter_finalized
}

enum RecommenderSourceType {
  manual
  ai_suggested
  linkedin_extract
}

model Recommender {
  id            String              @id @default(cuid())
  clientId      String
  client        Client              @relation(fields: [clientId], references: [id], onDelete: Cascade)
  name          String
  title         String?
  organization  String?
  relationship  String?
  linkedinUrl   String?
  email         String?
  phone         String?
  notes         String?             @db.Text
  status        RecommenderStatus   @default(suggested)
  sourceType    RecommenderSourceType @default(manual)
  aiReasoning   String?             @db.Text
  criteriaRelevance String[]        // which EB1A criteria this recommender covers
  attachments   RecommenderAttachment[]
  caseDrafts    CaseDraft[]         // rec letters linked to this recommender
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  @@index([clientId])
}

model RecommenderAttachment {
  id              String       @id @default(cuid())
  recommenderId   String
  recommender     Recommender  @relation(fields: [recommenderId], references: [id], onDelete: Cascade)
  name            String
  fileType        String
  storageKey      String
  createdAt       DateTime     @default(now())
}
```

### Status Flow

```
suggested -> identified -> contacted -> confirmed -> letter_drafted -> letter_finalized
```

Any status can revert to a previous state. `suggested` is set by AI agent or LinkedIn extraction. `identified` means lawyer/applicant confirmed this is a real person they want to pursue.

### AI Suggestion Agent

- Model: `gemini-2.5-pro`
- Trigger: Manual "Suggest Recommenders" button on Recommenders tab
- Approach: Agentic tool-use loop (same pattern as EB1A evaluator)
- Tools available:
  - `get_client_profile` - intake data, field of expertise, achievements
  - `search_vault` - RAG search across client's vault
  - `get_gap_analysis` - current gap analysis with weak criteria
  - `get_eligibility_report` - criteria scores and evidence
- Output: 5-8 suggested recommender *role types* (not specific people), each with:
  - `roleType`: e.g. "Former PhD Advisor", "Industry CTO who adopted your research"
  - `reasoning`: why this type of recommender strengthens the case
  - `criteriaRelevance`: which EB1A criteria they'd address
  - `idealQualifications`: what makes a strong pick for this role
  - `sampleTalkingPoints`: 2-3 key points their letter should cover
- Suggestions saved as `Recommender` records with `status=suggested`, `sourceType=ai_suggested`

### API Endpoints

```
GET    /api/cases/[clientId]/recommenders          - list all
POST   /api/cases/[clientId]/recommenders          - create one
PATCH  /api/cases/[clientId]/recommenders/[id]     - update
DELETE /api/cases/[clientId]/recommenders/[id]     - delete
POST   /api/cases/[clientId]/recommenders/suggest  - trigger AI suggestion agent
POST   /api/cases/[clientId]/recommenders/[id]/attachments - upload CV/bio
DELETE /api/cases/[clientId]/recommenders/[id]/attachments/[attachmentId]
```

All endpoints require auth. Lawyer must be assigned to case. Applicant can only access own case.

### UI Components

- **Recommenders Tab** on case detail page (lawyer) + applicant dashboard section
- **RecommenderList**: table/cards with name, title, org, status badge, criteria tags, actions
- **RecommenderForm**: sheet/dialog for add/edit with fields: name, title, org, relationship, LinkedIn URL, email, phone, notes
- **RecommenderDetail**: slide-over sheet showing full info, attachments, linked draft status
- **AISuggestionsPanel**: triggered by button, shows streaming suggestions with accept/dismiss actions
- **StatusPipeline**: visual pipeline showing count at each status stage

---

## B. Smart Document Ingestion

### Enhanced Document Processing

Modify existing `POST /api/vaults/[id]/documents/process` pipeline:

1. **Silent classification** (already exists via `categorizeDocument`) - no changes needed, already runs in parallel with embedding
2. **Add `linkedin-profile` category** to `DOCUMENT_CATEGORIES` in `lib/document-categories.ts`:
   ```
   { slug: "linkedin-profile", label: "LinkedIn Profile", description: "LinkedIn profile exports and professional network data" }
   ```
3. **LinkedIn PDF detection**: after categorization, if category is `linkedin-profile`:
   - Run LinkedIn extraction agent to parse structured data
   - Extract potential recommender candidates (people mentioned: managers, collaborators, endorsers)
   - Auto-create `Recommender` records with `status=suggested`, `sourceType=linkedin_extract`
   - Requires `clientId` passed to processing endpoint (currently only has `vaultId` - need to resolve client from vault)

### LinkedIn Extraction Agent

- Model: `gemini-2.5-flash` (fast, structured extraction)
- Input: full text of LinkedIn PDF
- Output schema:
  ```ts
  {
    profileData: {
      headline: string
      currentRole: string
      company: string
      skills: string[]
      recommendations: { recommenderName: string, recommenderTitle: string, text: string }[]
    }
    potentialRecommenders: {
      name: string
      title: string
      organization: string
      relationship: string  // inferred: "manager", "colleague", "endorser"
      reasoning: string
    }[]
  }
  ```
- Only creates recommenders if client record exists (vault -> client lookup)

### Changes Required

- Add `linkedin-profile` to `DOCUMENT_CATEGORIES`
- Add client lookup from vault in processing route
- Add LinkedIn extraction function in `lib/linkedin-parser.ts` (enhance existing file)
- Create recommender records from extraction results
- No UI changes to upload flow - classification remains silent

---

## C. Dedicated Document Drafting UI

### Document Types (7)

| Type | Slug | Description |
|------|------|-------------|
| Petition Letter | `petition-letter` | Main I-140 petition letter arguing EB1A eligibility |
| Personal Statement | `personal-statement` | Applicant's narrative of achievements and contributions |
| Recommendation Letter | `recommendation-letter` | Letter from recommender (linked to Recommender record) |
| Cover Letter | `cover-letter` | Cover letter for the petition package |
| Exhibit List | `exhibit-list` | Numbered list of all exhibits with descriptions |
| Table of Contents | `table-of-contents` | TOC for the petition package |
| RFE Response | `rfe-response` | Response to Request for Evidence |

### Data Models

```prisma
enum DraftDocumentType {
  petition_letter
  personal_statement
  recommendation_letter
  cover_letter
  exhibit_list
  table_of_contents
  rfe_response
}

enum DraftStatus {
  not_started
  generating
  draft
  in_review
  final
}

model CaseDraft {
  id             String            @id @default(cuid())
  clientId       String
  client         Client            @relation(fields: [clientId], references: [id], onDelete: Cascade)
  documentType   DraftDocumentType
  title          String
  content        Json?             // TipTap JSON document
  plainText      String?           @db.Text  // plain text mirror for AI context
  sections       Json?             // section metadata: [{ id, title, status, order }]
  status         DraftStatus       @default(not_started)
  recommenderId  String?           // only for recommendation_letter type
  recommender    Recommender?      @relation(fields: [recommenderId], references: [id])
  versions       CaseDraftVersion[]
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  @@index([clientId])
  @@index([clientId, documentType])
  @@unique([clientId, documentType, recommenderId]) // one draft per type per recommender
}

model CaseDraftVersion {
  id          String    @id @default(cuid())
  draftId     String
  draft       CaseDraft @relation(fields: [draftId], references: [id], onDelete: Cascade)
  content     Json      // TipTap JSON snapshot
  plainText   String?   @db.Text
  sections    Json?
  versionNote String?
  createdBy   String?   // userId
  createdAt   DateTime  @default(now())

  @@index([draftId])
}
```

### AI Drafting Agents

7 specialized agents, one per document type. All share the same tool set but have type-specific system prompts.

**Shared tools:**
- `get_client_profile` - full intake data
- `search_vault` - RAG search with query
- `get_gap_analysis` - current gap analysis
- `get_eligibility_report` - criteria scores
- `get_existing_drafts` - other drafts for cross-reference (e.g., petition letter references personal statement)
- `get_recommender` - recommender details (for rec letter agent)

**Generation approach - hybrid:**
1. **Full generation**: agent generates complete document with section markers
2. **Per-section regeneration**: user selects a section, provides optional instruction, agent regenerates just that section with full document context
3. **Chat refinement**: user can chat with agent about the draft, agent suggests edits

**Model selection:**
- `gemini-2.5-pro` for petition letter and RFE response (complex, long)
- `gemini-2.5-flash` for other document types

**Token strategy for long documents:**
- Petition letter: generate section-by-section sequentially, assembling into full document
- Other docs: single generation call
- All regeneration: single section at a time with full doc as context

### API Endpoints

```
GET    /api/cases/[clientId]/drafts                     - list all drafts
POST   /api/cases/[clientId]/drafts                     - create draft
GET    /api/cases/[clientId]/drafts/[id]                - get draft with content
PATCH  /api/cases/[clientId]/drafts/[id]                - update content/status
DELETE /api/cases/[clientId]/drafts/[id]                - delete draft
POST   /api/cases/[clientId]/drafts/[id]/generate       - trigger full AI generation (streaming)
POST   /api/cases/[clientId]/drafts/[id]/regenerate     - regenerate specific section (streaming)
POST   /api/cases/[clientId]/drafts/[id]/versions       - save version snapshot
GET    /api/cases/[clientId]/drafts/[id]/versions       - list versions
```

### UI Pages

#### Drafts Index: `/cases/[clientId]/drafts`

- Grid of 7 document type cards
- Each card shows: doc type name, status badge, last updated, action button (Create/Edit/View)
- For recommendation letters: expandable section showing one card per recommender with `status >= confirmed`
- Quick stats: X of 7 started, X finalized

#### Drafting Workspace: `/cases/[clientId]/drafts/[id]`

Two-panel layout:

**Left panel - AI Panel (collapsible, ~40% width):**
- "Generate" button (full document generation)
- Section list with per-section "Regenerate" buttons
- Optional instruction input per section
- Chat interface for refinement questions
- Generation status/progress indicator

**Right panel - Editor (~60% width):**
- TipTap rich text editor with toolbar
- Section headings as navigable anchors
- Real-time content from AI streams into editor
- Manual editing always available
- Version history dropdown in toolbar

**Header:**
- Document type title, status badge
- Save button (auto-save on edit with debounce)
- "Save Version" button (explicit snapshot)
- Back to drafts index

#### Case Detail Integration

Add two new tabs to lawyer case detail page:
- **Recommenders tab**: RecommenderList + AISuggestionsPanel
- **Drafts tab**: mini drafts index (cards grid) with link to full drafts page

Add to applicant dashboard:
- Recommenders section (view + add own recommenders)
- Drafts section (view + edit personal statement, review other drafts)

---

## Data Model Summary

New models: `Recommender`, `RecommenderAttachment`, `CaseDraft`, `CaseDraftVersion`

New enums: `RecommenderStatus`, `RecommenderSourceType`, `DraftDocumentType`, `DraftStatus`

Relations added to `Client`:
```prisma
model Client {
  // ... existing fields
  recommenders  Recommender[]
  caseDrafts    CaseDraft[]
}
```

### Migration Notes

- Existing `Client.recommenders` Json field contains free-text recommender data from onboarding intake. Migration strategy: keep the Json field as `recommenderNotes` (rename), new structured data goes into `Recommender` model. Optionally parse existing Json into Recommender records post-migration.

---

## Open Questions (A-C)

- Migrate existing `Client.recommenders` JSON field to new model or keep as legacy notes?
- Rec letter drafts: require linked recommender or allow generic?
- Token strategy for 40-page petition letter: single call or section-by-section?
- Draft export format: server-side (puppeteer/docx) or client-side?
- Rate limiting on AI generation: per-user or per-case?

---

## D. Lawyer Dashboard, Unified Routing & Case Sidebar

**Depends on:** Existing lawyer routes, AppSidebar, LawyerSidebar, case detail tabs, auth system, AI SDK agent patterns.

### Goals

- Lawyer dashboard matches reference layout: greeting, assistant chatbox, stats cards, case table
- Dashboard assistant agent answers questions about all cases using full toolkit (case data + RAG)
- All case routes use `/cases/[clientId]` for both roles -- remove `/my-case`
- Lawyer case detail uses secondary sidebar (alongside collapsed primary) instead of tabs
- Dev-only role toggle for testing both views

### Non-goals

- Production role switching UI (auth-based only)
- New data models or schema changes
- Timeline feature implementation (placeholder page only)
- "Create case" or "Upload files" flows (buttons present, stubbed)

---

### D1. Role Context + Dev Toggle

**RoleProvider** (`components/role-provider.tsx`):
- React context: `{ role, setRole, clientId }`
- Reads from session via NextAuth. In dev (`NODE_ENV === 'development'`), reads override from `localStorage` key `dev-role-override`
- Wrap root `app/layout.tsx` with `<RoleProvider>`

**Dev Toggle** (`components/dev-role-toggle.tsx`):
- Pill/switch in header, only rendered when `NODE_ENV === 'development'`
- Toggles between lawyer/applicant, persists to localStorage

---

### D2. Unified Routing

Current state: `/my-case` for applicant, `/lawyer/cases/[clientId]` for lawyer. Both have separate route groups with separate layouts.

**Changes:**

1. **New shared route**: `app/cases/[clientId]/` with role-aware layout
   - `layout.tsx`: lawyer gets dual sidebar (primary collapsed + case sidebar), applicant gets AppSidebar + content
   - `page.tsx`: overview (case header + summary)

2. **Redirect /my-case**: convert `app/(dashboard)/my-case/page.tsx` to server component that fetches user's clientId, `redirect(`/cases/${clientId}`)`

3. **Update AppSidebar**: "My Case" nav resolves to `/cases/[clientId]` dynamically via RoleProvider's clientId

4. **Move drafts routes**: unify `(lawyer)/cases/[clientId]/drafts/` and `(dashboard)/cases/[clientId]/drafts/` under `app/cases/[clientId]/drafts/`

5. **Middleware**: allow both roles on `/cases/*`, rely on `lib/case-auth.ts` for case-level auth

---

### D3. Secondary Case Sidebar

**CaseSidebar** (`components/case-sidebar.tsx`):
Uses shadcn Sidebar. Sections:
- Overview: `/cases/[clientId]`
- Documents: `/cases/[clientId]/vault`
- Recommenders: `/cases/[clientId]/recommenders`
- Drafts: `/cases/[clientId]/drafts` (collapsible sub-items for 7 doc types)
- Timeline: `/cases/[clientId]/timeline`
- Gap Analysis: `/cases/[clientId]/gap-analysis`
- Assistant: `/cases/[clientId]/assistant`

Active state via `useParams()` + `usePathname()`.

**Dual sidebar layout** (`app/cases/[clientId]/layout.tsx`):
- Lawyer: `<LawyerSidebar collapsible="icon" defaultOpen={false}>` + `<CaseSidebar>` + content
- Applicant: `<AppSidebar>` + content (no case sidebar)

**Decompose current tabs into sub-pages** (extracted from `app/(lawyer)/cases/[clientId]/page.tsx`):
- `app/cases/[clientId]/vault/page.tsx`
- `app/cases/[clientId]/recommenders/page.tsx`
- `app/cases/[clientId]/gap-analysis/page.tsx`
- `app/cases/[clientId]/assistant/page.tsx`
- `app/cases/[clientId]/timeline/page.tsx` (placeholder)

---

### D4. Lawyer Dashboard Redesign

**Stats API** (`app/api/lawyer/dashboard/stats/route.ts`):
- Active cases: CaseAssignment count for current lawyer
- Pending review: clients where `status='submitted'` assigned to lawyer
- Drafts in progress: CaseDraft count where `status IN ('draft','generating')` for lawyer's cases
- Unassigned: clients with no CaseAssignment, `status != 'draft'`

**Dashboard page** (`app/(lawyer)/dashboard/page.tsx`):
Layout top-to-bottom:
1. Greeting: "Good [morning/afternoon], [name]"
2. Centered assistant chatbox with text input
3. Quick action buttons row: "Case Summary", "Check Deadlines", "Draft Status", "Gap Analysis"
4. 4 stat cards: Active Cases, Pending Review, Drafts In Progress, Unassigned
5. Case table with search + "Create case" + "Upload files" buttons
6. Table columns: Name, Status, Updated, Visa Type, Case Files count

**Case table** (`components/lawyer/case-table.tsx`):
shadcn Table replacing current card grid. Reuses `/api/lawyer/cases` endpoint.

---

### D5. Dashboard Assistant Agent

**Agent tools** (`lib/dashboard-agent-tools.ts`):
Following Vercel AI SDK `tool()` pattern:
- `get_all_cases` -- all cases assigned to lawyer as JSON (id, name, status, verdict, draft counts, recommender counts)
- `get_case_detail(clientId)` -- single case with full status, recommenders, drafts, gap analysis summary
- `search_vault(clientId, query)` -- RAG search via existing `queryRelevantChunks`
- `get_gap_analysis(clientId)` -- gap analysis with criteria scores
- `get_eligibility_report(clientId)` -- eligibility verdict + criteria
- `get_existing_drafts(clientId)` -- all drafts with status and plainText preview

All tools scope to authenticated lawyer's assigned cases.

**API route** (`app/api/lawyer/assistant/route.ts`):
- ToolLoopAgent with dashboard tools
- System prompt: "You are a legal case management assistant. Help lawyers review case statuses, find info across documents, track progress."
- Streaming via `createAgentUIStreamResponse` (same pattern as existing `app/api/assistant/query/route.ts`)

**Frontend** (`components/lawyer/dashboard-chat.tsx`):
- `useChat` from AI SDK pointed at `/api/lawyer/assistant`
- Messages render below input
- Quick action buttons prepopulate input text

---

### D. File Summary

| Action | File |
|--------|------|
| New | `components/role-provider.tsx` |
| New | `components/dev-role-toggle.tsx` |
| New | `app/cases/[clientId]/layout.tsx` |
| New | `app/cases/[clientId]/page.tsx` |
| New | `app/cases/[clientId]/vault/page.tsx` |
| New | `app/cases/[clientId]/recommenders/page.tsx` |
| New | `app/cases/[clientId]/gap-analysis/page.tsx` |
| New | `app/cases/[clientId]/assistant/page.tsx` |
| New | `app/cases/[clientId]/timeline/page.tsx` |
| Move | `app/(lawyer)/cases/[clientId]/drafts/` -> `app/cases/[clientId]/drafts/` |
| New | `components/case-sidebar.tsx` |
| New | `app/api/lawyer/dashboard/stats/route.ts` |
| New | `components/lawyer/case-table.tsx` |
| New | `components/lawyer/dashboard-chat.tsx` |
| New | `lib/dashboard-agent-tools.ts` |
| New | `app/api/lawyer/assistant/route.ts` |
| Modify | `app/(lawyer)/dashboard/page.tsx` |
| Modify | `app/(dashboard)/my-case/page.tsx` (becomes redirect) |
| Modify | `components/app-sidebar.tsx` |
| Modify | `app/layout.tsx` |
| Modify | `middleware.ts` |

### D. Implementation Order

1. D1 (role context) -- no breaking changes
2. D2 (unified routing) -- structural change
3. D3 (case sidebar) -- depends on D2
4. D4 (dashboard redesign) -- parallel with D2+D3
5. D5 (dashboard agent) -- depends on D4

---

### Open Questions (D)

- Dual `<Sidebar>` in one `<SidebarProvider>` -- supported by shadcn? may need custom wrapper
- "File type" column -- visa category (EB-1A) or document format?
- "Create case" button -- stub only or skip?
- "Check Deadlines" -- no deadline fields in schema; agent returns "no data" or add schema?
- Timeline page -- placeholder text or skip route entirely?
- Should `/cases/[clientId]` live in route group `(cases)` or bare at top level?
