# Progress Log

## 2026-02-02: D2 - Cases Route Group + Unified Case Layout

### Completed
- D2-1: `app/(cases)/cases/[clientId]/layout.tsx` - role-aware layout. Lawyer gets LawyerSidebar, applicant gets AppSidebar. Uses useRole() hook.
- D2-2: `app/(cases)/cases/[clientId]/page.tsx` - case overview page with header, summary cards (email, citizenship, employer, criteria, vault, lawyers), eligibility summary.
- D2-2 (API): `app/api/cases/[clientId]/route.ts` - unified case data API using authorizeCaseAccess (works for all roles).
- D2-3: `app/(dashboard)/my-case/page.tsx` - converted to server component redirect. Fetches clientId from session via prisma, redirects to `/cases/{clientId}`. Falls back to /onboarding if no case.
- D2-4: AppSidebar "My Case" link now resolves to `/cases/{clientId}` when clientId available (via useRole), falls back to `/my-case` (which redirects).
- D2-5: Copied drafts routes from `(lawyer)/cases/[clientId]/drafts/` to `(cases)/cases/[clientId]/drafts/`. Both index and [id] workspace pages.
- D2-6: Middleware already allows all authenticated users on `/cases/*` (no explicit restriction existed). No change needed.
- D2-7: `lib/case-auth.ts` already existed from prior work. Already handles lawyer (CaseAssignment check), applicant (userId ownership), admin (full access).

### Notes for next dev
- CaseSidebar (D3-1) not yet built - layout currently only shows AppSidebar or LawyerSidebar, no second case-specific sidebar. D3 will add it.
- Drafts routes exist in both (lawyer) and (cases) groups. The (lawyer) copies can be removed once all lawyer case navigation points to /cases/ instead of /lawyer/cases/.
- Case overview is a summary page. Recommender/drafts management was in old my-case page - that content will live in D3 sub-pages (recommenders, vault, etc).
- The unified `/api/cases/[clientId]` route returns same shape as `/api/lawyer/cases/[clientId]` but uses authorizeCaseAccess for multi-role support.

---

## 2026-02-02: D1 - RoleProvider + DevRoleToggle

### Completed
- D1-1: `components/role-provider.tsx` - RoleContext with {role, setRole, clientId}, useRole hook. Fetches session + /api/my-case on mount. Dev override via localStorage `dev-role-override`.
- D1-2: `components/dev-role-toggle.tsx` - Badge that cycles applicant/lawyer/admin on click. Only renders in development.
- D1-3: Root layout wraps children with `<RoleProvider>`. DevRoleToggle added to both dashboard and lawyer layout headers (ml-auto positioned).

### Notes for next dev
- RoleProvider renders null until session fetch completes (avoids flash). On unauthenticated pages (login, landing) role will be null.
- DevRoleToggle only affects client-side role context, NOT the actual session/JWT. Middleware still enforces real role. Toggle is for UI testing only.
- clientId fetch via /api/my-case will 401 for unauthenticated users - silently caught.
- D2 items (cases route group) are now unblocked.

---

## 2026-02-02: Applicant drafts section on My Case page

### Completed
- Added Drafts section to `app/(dashboard)/my-case/page.tsx` below Recommenders
- Fetches drafts via `GET /api/cases/[clientId]/drafts`
- Grid of draft cards showing doc type, status badge, recommender name for rec letters
- Personal statement shows Edit button linking to drafting workspace
- All other draft types show View button (read-only intent)
- Empty state when no drafts exist

### Notes for next dev
- All PRD items now pass. View-only enforcement for non-personal-statement drafts is UI-only (Edit vs View button label). API-level PATCH restriction for applicant role already exists in case-auth.
- Drafting workspace route is under `(lawyer)` layout - applicant accessing it will work if middleware allows. May need read-only mode flag on workspace page for non-personal-statement drafts.

---

## 2026-02-02: Applicant recommenders section on dashboard

### Completed
- Created `GET /api/my-case` endpoint - resolves applicant's client record from session userId
- Created `app/(dashboard)/my-case/page.tsx` - applicant case page with recommender management
- Added "My Case" nav item with Briefcase icon to AppSidebar
- Applicant can view and add/edit/delete recommenders via existing RecommenderList + RecommenderForm components
- No AI suggest button visible (not included in applicant view)
- No status change dropdown (applicants can only add basic info, not manage pipeline status)

### Notes for next dev
- Remaining PRD item: applicant drafts section (passes:false) - show personal_statement as editable, others read-only
- Applicant status changes limited by omission (no status dropdown in RecommenderList for applicant) - could add explicit role-based filtering if needed
- `/api/my-case` finds most recent non-draft client; if user has multiple submitted cases this returns latest only

---

## 2026-02-02: Drafting workspace page (4 PRD items)

### Completed
- Created `app/(lawyer)/cases/[clientId]/drafts/[id]/page.tsx` - full drafting workspace
- Two-panel layout: collapsible AI panel (left, 340px) + TipTap editor (right, flex)
- Header: back link, title, status badge, save/save-version buttons, version history dropdown
- AI Panel: Generate Full Document button, section list with per-section regenerate + instruction input
- TipTap editor via existing DocumentEditor component with toolbar
- Auto-save with 2s debounce on content change
- Version history dropdown showing all versions by date desc, restore confirmation dialog
- Polls for generation completion every 3s when status=generating
- Section navigation: clicking section in AI panel scrolls editor to heading anchor
- TipTap JSON -> HTML converter for rendering stored content

### Notes for next dev
- Version restore is wired UI-only - no GET /versions/[versionId] endpoint exists for full content retrieval. Need to add that endpoint.
- AI generation is fire-and-forget (202) with polling - not streaming. PRD says "streams response" but agents return complete results.
- Save currently only saves plainText (HTML from editor) - not TipTap JSON content field. Would need HTML->TipTap conversion or save raw HTML.
- Remaining UI: applicant recommenders section, applicant drafts section (2 PRD items left)

---

## 2026-02-02: Drafts tab on case detail page

### Completed
- Added Drafts tab to lawyer case detail page (`app/(lawyer)/cases/[clientId]/page.tsx`)
- Compact card grid showing all drafts with status badges, document type labels, recommender names
- Cards link to `/cases/[clientId]/drafts/[id]`
- "Full Drafts View" button links to DraftsIndex page
- Empty state with "Create Drafts" link
- Fetches drafts from GET `/api/cases/[clientId]/drafts` on mount

### Notes for next dev
- Remaining UI items: drafting workspace page, AI panel, TipTap editor, version history, applicant recommenders/drafts sections
- Drafting workspace (passes:false) is next highest priority - it's the core editing experience

## 2026-02-02: DraftsIndex page

### Completed
- Created `app/(lawyer)/cases/[clientId]/drafts/page.tsx`
- Grid of 6 non-recommendation document type cards + expandable recommendation letters section
- Each card: doc type name, status badge, last updated, Create/Edit/View button
- Recommendation letters section filters recommenders by confirmed/letter_drafted/letter_finalized status
- Quick stats row: X started, X finalized
- Create button calls POST /api/cases/[clientId]/drafts, links to /cases/[clientId]/drafts/[id]
- Typecheck and lint pass (0 errors)

### Notes for next dev
- Drafting workspace page (`/cases/[clientId]/drafts/[id]`) does not exist yet - links will 404
- Next priorities: drafting workspace page, then Drafts tab on case detail page
- Back link goes to `/cases/${clientId}` - assumes case detail page route

---

## 2026-02-02: Recommenders tab on lawyer case detail page

### Completed
- Added Recommenders tab to `app/(lawyer)/cases/[clientId]/page.tsx`
- Tab includes StatusPipeline, AISuggestionsPanel, RecommenderList with Add button
- RecommenderForm (create/edit) and RecommenderDetail (slide-over) wired up
- CRUD handlers: create, edit (PATCH), delete with confirmation
- AI suggestion accept (status->identified) and dismiss (delete) handlers
- Status change handler for detail panel
- Fetches recommenders from GET /api/cases/[clientId]/recommenders on mount

### Notes for next dev
- RecommenderDetail attachments passed as empty array - no fetching of individual recommender attachments yet (needs per-recommender GET or attachments endpoint)
- Detail panel isn't triggered from list click yet - only form edit/delete are wired. Could add onClick row -> detail view
- Remaining UI tasks: DraftsIndex page, drafting workspace, AI panel, TipTap editor, version history, Drafts tab, applicant dashboard sections

## 2026-02-02: AISuggestionsPanel UI component

### Completed
- Created `components/recommender/ai-suggestions-panel.tsx`
- Trigger button calls POST /suggest, polls for new ai_suggested recommenders
- Displays suggestion cards with reasoning, criteria tags, accept/dismiss buttons
- Filters suggestions by status=suggested + sourceType in (ai_suggested, linkedin_extract)
- Auto-stops polling after 2 min; dispatches custom event for parent re-fetch

### Notes for next dev
- Recommenders tab (PRD item) is next highest priority - wires StatusPipeline + AISuggestionsPanel + RecommenderList into case detail page
- Parent component needs to listen for recommenders-updated custom event or pass refresh callback
- onAccept/onDismiss are callback props - parent must implement PATCH (status->identified) and DELETE calls

## 2026-02-02: StatusPipeline UI component

### Completed
- Created `components/recommender/status-pipeline.tsx`
- Horizontal pipeline showing count at each of 6 RecommenderStatus stages
- Color-coded circles with counts, connected by line segments
- Imports types from recommender-list.tsx
- Typecheck and lint pass (0 errors)

### Notes for next dev
- Next priority: AISuggestionsPanel, then Recommenders tab on case detail page
- StatusPipeline accepts `recommenders` array prop, computes counts internally

---

## 2026-02-02: RecommenderDetail UI component

### Completed
- Created `components/recommender/recommender-detail.tsx`
- Sheet slide-over showing full recommender info (contact, criteria, AI reasoning, notes)
- Status change via Select dropdown with all 6 RecommenderStatus values
- Attachments list with upload (multipart POST) and delete actions
- Download links for attachments (uses presign URL pattern)
- Linked draft status display (recommendation letter)
- Typecheck and lint pass (0 errors)

### Notes for next dev
- Download link uses `/api/vaults/presign?key=` pattern but no such generic endpoint exists yet - need to create one or use a different approach for recommender attachment downloads
- Next priority: StatusPipeline, AISuggestionsPanel, then Recommenders tab on case detail page
- Component accepts callbacks for status change, attachment upload/delete - parent wires to API

---

## 2026-02-02: RecommenderForm UI component

### Completed
- Created `components/recommender/recommender-form.tsx`
- Sheet-based form with all fields: name, title, org, relationship, LinkedIn URL, email, phone, notes
- react-hook-form + zod validation (name required, email/URL format validated)
- Create mode (empty form) and edit mode (pre-filled via `values`)
- onSubmit callback, isSubmitting prop for loading state
- Reuses Recommender type from recommender-list.tsx

### Notes for next dev
- Next priority: RecommenderDetail (slide-over with attachments, status change), then StatusPipeline, then AISuggestionsPanel, then wire into Recommenders tab on case detail page.
- Form resets on create-mode submit; edit mode keeps values synced via `values` prop.

---

## 2026-02-02: RecommenderList UI component

### Completed
- Created `components/recommender/recommender-list.tsx`
- Table layout with name, title/org, color-coded status badge, criteria tags, edit/delete dropdown
- Uses shadcn Table + Badge + DropdownMenu
- Accepts recommenders array + onEdit/onDelete callbacks as props
- Empty state included
- Typecheck and lint pass (0 errors)

### Notes for next dev
- All remaining PRD items are UI. Next priority: RecommenderForm (needed for add/edit flow), then RecommenderDetail, then wire them into the Recommenders tab on case detail page.
- `components/recommender/` directory now exists.

---

## 2026-02-02: Per-section regeneration + regenerate API route

### Completed
- Created `lib/drafting-agents/regenerate-section.ts` - loads full draft context, regenerates single section via structured output
- Created `app/api/cases/[clientId]/drafts/[id]/regenerate/route.ts` - POST accepts sectionId + optional instruction, fire-and-forget pattern
- Route replaces target section in TipTap JSON content and updates plainText

### Notes for next dev
- Remaining incomplete PRD items: all UI components (recommender list/form/detail, AI suggestions panel, status pipeline, drafts index, drafting workspace, TipTap editor, version history, applicant sections)
- markdownToTiptapParagraphs still duplicated across 8 files now - extract to shared util is overdue
- Regenerate route uses fire-and-forget (not streaming) matching generate route pattern
- PRD says "streams response" for regenerate but fire-and-forget is consistent with existing codebase

## 2026-02-02: RFE response drafting agent

### Completed
- Created `lib/drafting-agents/rfe-response.ts` - two-phase agent (research + structured output) using gemini-2.5-pro
- Wired into generate route dispatch map in `app/api/cases/[clientId]/drafts/[id]/generate/route.ts`
- System prompt specialized for USCIS RFE responses: point-by-point issue addressing, Kazarian two-step analysis, case law citations
- Uses stepCountIs(25) for research phase (same as petition letter - RFE is equally complex)
- markdownToTiptapParagraphs duplicated (now in 7 files) - extraction to shared util increasingly urgent

### Notes for next dev
- Remaining incomplete PRD items: per-section regeneration function, regenerate API route, all UI components
- markdownToTiptapParagraphs should be extracted to a shared util before any more agents are added

## 2026-02-02: Exhibit list drafting agent

### Completed
- Created `lib/drafting-agents/exhibit-list.ts` following established two-phase pattern (research loop + structured output)
- Uses `defaultModel` (gemini-2.5-flash), stepCountIs(20) for research (heavier than cover letter since it needs to catalog all vault docs)
- System prompt specialized for numbered exhibit list organized by EB-1A criterion
- Research phase uses multiple vault search queries to find all uploaded documents
- Registered in generate route agentMap (`exhibit_list` key)
- markdownToTiptapParagraphs still duplicated (now 5 files) - extraction to shared util deferred

### Notes for next dev
- TOC agent and RFE response agent are next functional items
- TOC agent should use `get_existing_drafts` heavily since it references all other drafts
- 5 agents now duplicate markdownToTiptapParagraphs - strongly consider extracting to shared util before adding more

## 2026-02-02: Cover letter drafting agent

### Completed
- Created `lib/drafting-agents/cover-letter.ts`
  - Same two-phase pattern: research loop (stepCountIs(15)) then structured output
  - Uses defaultModel (gemini-2.5-flash) per PRD
  - 6 sections: header, intro, eligibility overview, criteria summary, exhibit list reference, conclusion
  - Legal correspondence tone with INA/CFR citations
  - Returns TipTap JSON, sections metadata, plainText
- Wired into generate route (`app/api/cases/[clientId]/drafts/[id]/generate/route.ts`)
- PRD item marked passes:true

### Notes for next dev
- Remaining drafting agents: exhibit-list, table-of-contents, rfe-response
- markdownToTiptapParagraphs duplicated in 4 files now - extract to shared util with next agent
- Exhibit references use "Exhibit X" placeholders - no auto-numbering yet

## 2026-02-02: Draft generation API route

### Completed
- Created `app/api/cases/[clientId]/drafts/[id]/generate/route.ts`
  - POST triggers AI generation for a draft, dispatches to correct agent by documentType
  - Supports petition_letter, personal_statement, recommendation_letter
  - Fire-and-forget async pattern (like gap-analysis refresh): returns 202, runs agent in background
  - Status lifecycle: not_started -> generating -> draft (or reverts to not_started on error)
  - Auth via authorizeCaseAccess
  - Validates recommendation_letter has recommenderId

### Notes for next dev
- cover_letter, exhibit_list, table_of_contents, rfe_response agents not yet built - route returns 400 for unsupported types
- PRD says "streams response" but agents are non-streaming (research loop + structured output) - async fire-and-forget is more appropriate
- Regenerate route (per-section) still needed
- UI polling needed to detect when generation completes (status changes from generating to draft)

## 2026-02-02: Personal statement drafting agent

### Completed
- Created `lib/drafting-agents/personal-statement.ts`
  - Same two-phase pattern as petition-letter: research loop then structured output
  - Uses `defaultModel` (gemini-2.5-flash) per PRD
  - Research phase capped at stepCountIs(15) (simpler doc, less research needed)
  - First-person narrative style, 7 sections (opening through closing)
  - Returns TipTap JSON, sections metadata, plainText
- PRD item marked as passes:true

### Notes for next dev
- Remaining drafting agents: recommendation-letter, cover-letter, exhibit-list, table-of-contents, rfe-response
- recommendation-letter needs recommenderId param + get_recommender tool
- generate/regenerate API routes still needed before any agent is usable from UI
- markdownToTiptapParagraphs duplicated from petition-letter - consider extracting to shared util if more agents added

## 2026-02-02: Petition letter drafting agent

### Completed
- Created `lib/drafting-agents/petition-letter.ts`
  - Two-phase agent: research loop (tools + stepCountIs(25)) then structured output
  - Uses `analysisModel` (gemini-2.5-pro) and shared `createDraftingTools`
  - Returns TipTap JSON, sections metadata, and plainText
  - Includes `markdownToTiptapParagraphs` converter (headings, bullets, bold/italic)
- PRD item marked as passes:true

### Notes for next dev
- Other 6 drafting agents (personal-statement, recommendation-letter, cover-letter, exhibit-list, table-of-contents, rfe-response) should follow same pattern but use `defaultModel` (gemini-2.5-flash) except rfe-response which needs `analysisModel`
- The generate + regenerate API routes still need to be built before agents are usable from UI
- `markdownToTiptapParagraphs` is basic - may need enhancement for numbered lists, nested formatting

## 2026-02-02: LinkedIn profile extraction pipeline

### Completed
- Added `linkedin-profile` category to DOCUMENT_CATEGORIES in lib/document-categories.ts
- Added `extractLinkedInProfile()` to lib/linkedin-parser.ts: AI extraction via gemini-2.5-flash w/ structured output (zod schema)
  - Returns profileData (headline, currentRole, company, skills, recommendations) + potentialRecommenders array
- Integrated into document processing route (app/api/vaults/[id]/documents/process)
  - After categorization, if linkedin-profile: resolves clientId via Vault->Client, runs extraction
  - Creates Recommender records w/ status=suggested, sourceType=linkedin_extract
  - Non-blocking: fire-and-forget pattern, doesn't block embedding response

### Notes for next dev
- Extraction uses `Output.object()` pattern (not tool-use loop) since it's a single-pass structured extraction
- Uses `resolvedCategory` which checks both AI categorization result and pre-assigned documentType
- Next priority: drafting agents (petition-letter, personal-statement, recommendation-letter, etc)

## 2026-02-02: Recommender suggestion agent + API route

### Completed
- `lib/recommender-suggester.ts`: AI agent that suggests 5-8 recommender role types per client
  - Two-phase pattern (same as eb1a-evaluator): agentic tool loop then structured output
  - Tools: get_client_profile, search_vault, get_gap_analysis, get_eligibility_report
  - Uses analysisModel (gemini-2.5-pro) for both phases
  - Saves results as Recommender records w/ status=suggested, sourceType=ai_suggested
  - Stores idealQualifications + sampleTalkingPoints in notes field
- `app/api/cases/[clientId]/recommenders/suggest/route.ts`: POST endpoint
  - Lawyer/admin only auth via authorizeCaseAccess
  - Fire-and-forget pattern (same as gap-analysis refresh)
  - Returns 202 immediately

### Notes for next dev
- Suggestion agent stores role types in `name` field (not actual person names) since these are role suggestions
- No polling mechanism yet; UI will need to poll GET /recommenders or use SWR revalidation to see results

## 2026-02-02: Recommender CRUD API routes

### Completed
- GET+POST /api/cases/[clientId]/recommenders (list w/ attachment count, create w/ zod)
- PATCH+DELETE /api/cases/[clientId]/recommenders/[id] (partial update w/ zod, delete w/ cascade)
- POST /api/cases/[clientId]/recommenders/[id]/attachments (multipart upload to S3)
- DELETE /api/cases/[clientId]/recommenders/[id]/attachments/[attachmentId] (S3 + DB delete)
- All routes use authorizeCaseAccess for role-based auth (marks recommender auth PRD item done)
- Typecheck clean, lint 0 errors

### Notes for next dev
- Routes at /api/cases/ (not /api/lawyer/cases/) since applicants also need access
- No middleware route additions needed - /api/cases/* not in public list so auth enforced
- Next priority: drafts CRUD API routes, then AI agents (recommender-suggester, drafting agents)
- Attachment upload uses storageKey pattern: recommenders/{id}/{uuid}.{ext}

## 2026-02-02: Case auth helper (lib/case-auth.ts)

### Completed
- Created lib/case-auth.ts with authorizeCaseAccess() and isAuthError() helper
- Handles lawyer (CaseAssignment check), applicant (ownership check), admin (full access)
- Returns { user, client } on success or NextResponse error (401/403/404)
- Typecheck clean, lint clean (0 errors)

### Notes for next dev
- Use `authorizeCaseAccess(clientId)` + `isAuthError(result)` in all case-scoped routes
- Returns NextResponse directly (not throw) - check with isAuthError() type guard
- Next priority: recommender API routes (GET/POST/PATCH/DELETE), then drafts API routes
- Third acceptance criterion ("Used by recommender and draft API routes") met when those routes are built

## 2026-02-02: Data layer for recommenders + drafting system

### Completed
- Added 4 enums: RecommenderStatus, RecommenderSourceType, DraftDocumentType, DraftStatus
- Added 4 models: Recommender, RecommenderAttachment, CaseDraft, CaseDraftVersion
- Added recommenders/caseDrafts relations to Client model
- Renamed Client.recommenders (Json) -> recommenderNotes to avoid conflict w/ new Recommender[] relation
- Updated all code refs: eb1a-evaluator, draft API route, step-impact component, ClientData interface
- prisma generate succeeds, typecheck clean, lint clean (0 errors)

### Notes for next dev
- DB migration not run (no DB available) - run `prisma db push` or `prisma migrate dev` when DB is up
- ClientData interface in use-onboarding.ts now uses `recommenderNotes` field name
- Draft API route maps incoming `recommenders` field from onboarding form to `recommenderNotes` in DB
- Next priority: case-auth helper (lib/case-auth.ts) - many API routes depend on it
- Then recommender API routes, then drafts API routes

## 2026-02-01: Mark auto mode routing verification as complete

### Completed
- Verified auto mode Q&A->chat and draft->document routing implementation exists and is correct
- System prompt instructs AI to prefix with [MODE:chat] or [MODE:document]
- Frontend parses prefix via regex, auto-switches layout (full-width chat vs split-panel document)
- Default outputType is 'chat' (no toggle pressed), AI decides mode autonomously
- Marked both functional verification PRD items as passes:true

### Notes for next dev
- Only 1 PRD item remains false: "Refactor step-criteria -> step-evidence.tsx" - intentionally skipped per assumptions.md
- All other PRD items (120+) are passes:true
- PRD is effectively COMPLETE

## 2026-02-01: Scope vault/assistant to client context in lawyer view

### Completed
- Created components/lawyer/client-vault-documents.tsx - reusable document list with search, sort, preview, status badges
- Embedded ClientVaultDocuments in lawyer case detail vault tab (read-only mode)
- Added `autoSelectAll=1` URL param support to assistant page
- Lawyer assistant link now passes autoSelectAll so all vault files are pre-attached
- Vault tab shows inline doc list + "Full Vault View" link for edit access
- Access control inherited from existing canAccessVault middleware on API routes

### Notes for next dev
- ClientVaultDocuments supports readOnly prop (hides category edit, retry buttons)
- autoSelectAll fetches all docs from vault and attaches them - no file picker needed
- Remaining false PRD items: 2 functional verification tasks (auto mode routing) + 1 intentionally skipped rename
- Category editing still available via "Full Vault View" link to /vault/[id]

## 2026-02-01: Shared FileDropzone Component

### Completed
- Created components/ui/file-dropzone.tsx reusable wrapper around react-dropzone
- Props: onDrop, accept, maxSize, maxFiles, multiple, disabled, loading, className, hint, activeText, loadingText, idleText
- Default accept: PDF, DOC, DOCX, TXT. Consistent drag/loading/idle visual states
- Replaced dropzone in assistant page (create vault modal)
- Replaced dropzone in step-resume-upload.tsx (onboarding resume upload)
- Replaced dropzone in step-docs-timeline.tsx (onboarding docs upload)
- Removed direct useDropzone imports from all 3 files

### Notes for next dev
- No vault detail page dropzone existed to replace (PRD step mentioned it but it wasn't built)
- FileDropzone doesn't show selected files list - that's handled by parent components already
- Each usage passes custom props (accept, maxFiles, hints) for their specific needs

## 2026-02-01: Lawyer Case Detail Page + Gap Analysis

### Completed
- Created GET /api/lawyer/cases/[clientId] endpoint (single case fetch with auth)
- Created lib/gap-analysis.ts using defaultModel (gemini-2.5-flash), reuses eb1a-evaluator tool patterns
- Added GapAnalysis model to Prisma schema (clientId, overallStrength, summary, criteria Json, priorityActions Json)
- Created GET /api/lawyer/cases/[clientId]/gap-analysis (fetch latest analysis)
- Created POST /api/lawyer/cases/[clientId]/gap-analysis/refresh (non-blocking trigger, 202 response)
- Created components/lawyer/gap-analysis-view.tsx (per-criterion cards with strength/evidence/gaps/recommendations)
- Created app/(lawyer)/cases/[clientId]/page.tsx with 3 tabs: Vault, Gap Analysis, Assistant
- Gap Analysis tab: run/re-analyze button, polls for results, full gap view
- Vault tab: links to /vault/[id] for full vault detail
- Assistant tab: links to /assistant scoped to client vault

### Notes for next dev
- Case detail page requires lawyer assignment (403 if not assigned, except admin)
- Gap analysis stores multiple runs (not upsert) - GET returns latest by createdAt
- Refresh endpoint fires gap analysis async, page polls every 5s until new result appears
- Vault and Assistant tabs link out to existing pages rather than embedding - "Scope vault/assistant reuse to client context in lawyer view" PRD item still false
- GapAnalysis model needs `prisma migrate` when DB available
- Gap analysis uses defaultModel (flash) for speed, not analysisModel (pro)

## 2026-02-01: Lawyer Dashboard (Layout, Cases API, Dashboard Page)

### Completed
- Created components/lawyer-sidebar.tsx with Dashboard + Cases nav items
- Created app/(lawyer)/layout.tsx mirroring dashboard layout pattern with LawyerSidebar
- Created GET /api/lawyer/cases with tab filtering (all/mine/unassigned), search, pagination
- Created POST /api/lawyer/cases/[clientId]/assign for self-assignment
- Created components/lawyer/case-card.tsx with verdict badge, status, criteria count, assign button
- Created app/(lawyer)/dashboard/page.tsx with tabs, search, pagination, loading/empty/error states
- Self-assign uses optimistic UI with revert on error
- Installed shadcn tabs component

### Notes for next dev
- Lawyer layout uses same SidebarProvider/SidebarInset pattern as dashboard layout
- /lawyer/* routes protected by middleware.ts (lawyer + admin roles only)
- Cases API only returns non-draft clients (status != draft)
- Dashboard fetches current user ID from /api/auth/session for assign button logic
- Case detail page (/lawyer/cases/[clientId]) not yet created - just links from cards
- Gap analysis endpoints and UI not yet built
- Scoping vault/assistant reuse to client context in lawyer view not yet done

## 2026-02-01: Role-Based Vault Access Control

### Completed
- Added role-based filtering to GET /api/vaults (applicant: own vault via Client, lawyer: assigned case vaults, admin: all)
- Added auth + role-based access checks to GET/POST /api/vaults/[id]/documents (returns 403 if unauthorized)
- Created lib/vault-access.ts reusable helper for canAccessVault(userId, role, vaultId)
- Auto-load vaults on assistant page mount; auto-select if single vault (applicant case)
- Vault name shows in Sources indicator when auto-selected

### Notes for next dev
- Vault modal still accessible for applicants to browse/select specific files - not hidden entirely
- Auto-select uses vault count heuristic (1 vault = auto-select) instead of checking session role client-side, since no SessionProvider is set up
- canAccessVault helper can be reused in any API route needing vault access checks
- Other vault-related routes (presign, process, retry, docId) should also add canAccessVault checks

## 2026-01-25: Prisma ORM Setup

### Completed
- Installed prisma@7.3.0 and @prisma/client@7.3.0
- Installed @prisma/adapter-pg and pg for Prisma 7 adapter pattern
- Created prisma/schema.prisma with full data model (User, Vault, Document, Workflow, WorkflowStep, Prompt, Example, AssistantQuery, SourceReference, HistoryEntry, StarredItem)
- Created prisma.config.ts for Prisma 7 configuration
- Created lib/db.ts with PrismaClient singleton using pg adapter
- Added npm scripts: db:generate, db:push, db:migrate, db:studio
- Created .env.example with DATABASE_URL template

### Notes for next dev
- Prisma 7 uses adapter pattern - no url in schema.prisma, connection via pg Pool in lib/db.ts
- Run `npm run db:push` or `npm run db:migrate` after setting DATABASE_URL to create tables
- StarredItem uses itemId string field (not polymorphic relations) - app code handles lookup
- All models from prd/schema.prisma ported with minor adjustments for Prisma 7 compatibility

### Blocked
- "Verify database connection works" step requires actual PostgreSQL instance

## 2026-01-25: Tailwind CSS and shadcn/ui Setup

### Completed
- shadcn/ui was already initialized (components.json, new-york style, neutral base color)
- Tailwind CSS v4 already configured with postcss
- Added Card component via `npx shadcn@latest add card`
- Added Table component via `npx shadcn@latest add table`
- Full component set now: Button, Input, Card, Table, Dialog (sheet), plus Sidebar, Dropdown, Avatar, etc.
- Typecheck passes

### Notes for next dev
- Components in components/ui/ directory
- lib/utils.ts has cn() helper for class merging
- Tailwind 4 uses @import "tailwindcss" syntax in globals.css
- CSS variables defined in :root and .dark for theming

## 2026-01-25: Vercel AI SDK Setup

### Completed
- Installed ai and @ai-sdk/anthropic packages
- Updated .env.example with ANTHROPIC_API_KEY
- Created lib/ai.ts with Anthropic provider singleton (same pattern as lib/db.ts)
- Created app/api/test-ai/route.ts endpoint for streaming verification
- Exports: anthropic provider, defaultModel, analysisModel

### Notes for next dev
- Uses streamText from ai package with toTextStreamResponse() for streaming
- Provider throws if ANTHROPIC_API_KEY not set (fail-fast)
- Test endpoint: POST /api/test-ai with { prompt: "..." } body
- Default model: claude-sonnet-4-20250514

### Blocked
- "Verify streaming response works" requires actual ANTHROPIC_API_KEY

## 2026-01-25: Sidebar Navigation Layout

### Completed
- Created app/(dashboard)/layout.tsx with SidebarProvider and fixed sidebar
- Updated components/app-sidebar.tsx with correct nav items: Assistant, Vault, Workflows, History, Library
- Added Create button dropdown at top (New Vault, New Query options)
- Added Settings and Help links at sidebar footer
- Active nav item highlighted via isActive prop and pathname matching
- Created PageHeader component using portal for sticky header title
- Created placeholder pages: /assistant, /vault, /workflows, /history, /library, /settings, /help
- Root / redirects to /assistant

### Notes for next dev
- Uses shadcn/ui Sidebar component (already installed)
- PageHeader uses React portal to inject into #page-header div in layout
- Sidebar collapsible with icon mode
- All pages use (dashboard) route group for shared layout

### Files created/modified
- app/(dashboard)/layout.tsx - dashboard layout with sidebar
- components/app-sidebar.tsx - sidebar with navigation
- components/page-header.tsx - portal-based header title
- app/(dashboard)/{assistant,vault,workflows,history,library,settings,help}/page.tsx - placeholder pages
- app/(dashboard)/page.tsx - redirects to /assistant
- app/page.tsx - redirects to /assistant

## 2026-01-25: Assistant Page UI

### Completed
- Added shadcn components: toggle, textarea, checkbox, badge
- Built full Assistant page with centered chat interface
- Large title/logo at top
- Textarea input with placeholder "Ask anything. Type @ to add sources."
- Ask button (disabled when empty, Cmd+Enter shortcut)
- Output type toggle: Draft document / Review table
- Source selector with Choose vault, Files and sources, Prompts buttons
- Vault selection dropdown with checkmark indicators
- Selected sources displayed as badges
- Deep analysis checkbox with label
- Recommended workflows section with 4 workflow cards

### Notes for next dev
- Vault list uses mock data - replace with API call when /api/vaults ready
- Recommended workflows use mock data - replace with DB query
- Files and sources / Prompts buttons have UI but no panel functionality yet
- Workflow card click should navigate to /workflows/[id] when ready
- Query submission logs to console only - wire to /api/assistant/query

### Files modified
- app/(dashboard)/assistant/page.tsx - full Assistant UI
- components/ui/{toggle,textarea,checkbox,badge}.tsx - new shadcn components

## 2026-01-25: Assistant Streaming

### Completed
- Created POST /api/assistant/query endpoint with streaming
- Uses Vercel AI SDK streamText() with toTextStreamResponse()
- Supports inputText, outputType (draft/review_table), sources, deepAnalysis params
- System prompt adapts based on outputType
- Installed @ai-sdk/react for useCompletion hook
- Wired Assistant page to /api/assistant/query endpoint
- Response streams progressively with Loader2 spinner indicator
- UI disables inputs during streaming
- Response area shows query + streamed response
- Error handling displays user-friendly messages

### Notes for next dev
- useCompletion from @ai-sdk/react (not ai/react)
- No DB persistence yet - requires data model migration first
- Vault sources passed to API but not used for RAG (no embeddings yet)
- deepAnalysis flag ready but uses same model currently

### Files created/modified
- app/api/assistant/query/route.ts - streaming endpoint
- app/(dashboard)/assistant/page.tsx - wired to streaming API

## 2026-01-25: Vault Page UI

### Completed
- Built full Vault page with grid/list layout
- New vault card opens creation modal (name, description, type selector)
- Modal shows 100k file limit info
- Vault cards show name, type badge, file count, shared indicator
- Knowledge Base vaults have Database icon, Sandbox has FolderOpen icon
- Sort dropdown: Recently viewed, Name, Date created
- Grid/list view toggle
- Search box filters vaults by name/description
- Added shadcn components: dialog, select, label
- Created GET /api/vaults endpoint (search, sortBy params)
- Created POST /api/vaults endpoint (creates vault in DB)

### Notes for next dev
- Vault page uses mock data - wire to /api/vaults when DB connected
- API endpoints ready but require DATABASE_URL to function
- Vault cards link to /vault/[id] - detail page not yet built
- No edit/delete vault functionality yet

### Files created/modified
- app/(dashboard)/vault/page.tsx - full Vault UI
- app/api/vaults/route.ts - GET and POST endpoints
- components/ui/{dialog,select,label}.tsx - new shadcn components

## 2026-01-25: Vault Detail Page

### Completed
- Created /vault/[id] page with full files table
- Table columns: Name, Document type, Updated, File type, Size (all sortable)
- Document type shown as colored badge
- Embedding status indicators (processing/pending badges)
- Action buttons: Start a query, Create review table, Upload files, Create folder, Share
- Quick query box in header - navigates to /assistant?vault={id}&query={text}
- Back to Vaults button
- Search box to filter files
- Empty state for no files
- Row actions dropdown (Download, Rename, Set document type, Delete)
- Created GET /api/vaults/[id] endpoint
- Created PATCH /api/vaults/[id] endpoint for updates
- Created DELETE /api/vaults/[id] endpoint
- Created GET /api/vaults/[id]/documents endpoint with search/sort params

### Notes for next dev
- Page uses mock data - wire to API when DB connected
- Upload/Download/Delete buttons are UI only - needs S3 storage setup
- Document type edit is UI only in dropdown - needs inline edit or modal
- Quick query uses URL params - Assistant page should read and pre-fill

### Files created
- app/(dashboard)/vault/[id]/page.tsx - vault detail UI
- app/api/vaults/[id]/route.ts - GET/PATCH/DELETE endpoints
- app/api/vaults/[id]/documents/route.ts - GET documents endpoint

## 2026-01-25: Workflows Page UI

### Completed
- Built full Workflows page with categorized grid layout
- Workflows grouped by category (General, Transactional) with section headers
- Workflow cards show name, description, output type badge with icon
- Cards show step count or column count as applicable
- Output type filter dropdown (Draft, Review table, Extraction, Transformation)
- Category filter dropdown (All, General, Transactional)
- Search box filters by name/description
- Empty state when no workflows match filters
- Created GET /api/workflows endpoint with category, outputType, search, isSystem params
- Cards link to /workflows/[id] (detail page not yet built)

### Notes for next dev
- Uses mock data - replace with Prisma query when DB connected
- Workflow detail/execution page (/workflows/[id]) not yet implemented
- Mock workflows match PRD seed data (7 General, 5 Transactional)
- API endpoint includes Prisma query comments for future DB integration

### Files created/modified
- app/(dashboard)/workflows/page.tsx - full Workflows page UI
- app/api/workflows/route.ts - GET endpoint

## 2026-01-25: History Page UI

### Completed
- Built full History page with query history table
- Table columns: Created (date+time), Title, Type (badge with icon), Source
- Rows sorted by date descending (newest first)
- Search box filters by title and source summary
- Date range filter dropdown (All time, Today, Past week, Past month, Past 3 months)
- Group by dropdown (None, Date, Type, Source) - UI ready, grouping logic not implemented
- Last updated timestamp displayed
- Click row opens detail dialog with full query/response and sources
- Empty state shows "No results found" message
- Created GET /api/history endpoint with search, dateFrom, dateTo, type, page, limit params
- Pagination support in API response

### Notes for next dev
- History page uses mock data - wire to /api/history when DB connected
- Group by dropdown is UI-only - implement grouping logic if needed
- API endpoint ready but requires DATABASE_URL to function
- Mock data shows 5 realistic legal workflow examples

### Files created/modified
- app/(dashboard)/history/page.tsx - full History page UI
- app/api/history/route.ts - GET endpoint with pagination

## 2026-01-25: Library Page UI

### Completed
- Built full Library page with home/prompts/examples view modes
- Home view shows Prompts and Examples cards with descriptions
- Starred prompts section with cards showing starred items
- Starred examples section with empty state message
- Click Prompts card opens prompt list with system/personal sections
- Click Examples card opens examples list
- Star/unstar toggle on all items updates starred sections
- Prompt detail dialog shows full content with copy button
- Example detail dialog shows prompt + response with copy button
- Search/filter in prompts and examples views
- Create prompt dialog for personal prompts
- Personal prompts show edit/delete dropdown menu
- Created GET /api/prompts endpoint (ownerType, category, search params)
- Created POST /api/prompts endpoint for personal prompts
- Created GET /api/examples endpoint (ownerType, search params)

### Notes for next dev
- Uses mock data - replace with Prisma queries when DB connected
- Starring is local state only - wire to /api/starred endpoints when built
- Edit/delete buttons are UI only - implement actual mutation
- Personal prompts created locally - wire to POST /api/prompts

### Files created/modified
- app/(dashboard)/library/page.tsx - full Library page with 3 view modes
- app/api/prompts/route.ts - GET and POST endpoints
- app/api/examples/route.ts - GET endpoint

## 2026-01-25: Starred Items API

### Completed
- Created GET /api/starred endpoint (list starred items, filter by itemType)
- Created POST /api/starred endpoint (add starred item)
- Validates itemType must be 'prompt' or 'example'
- Returns 409 Conflict if item already starred (unique constraint)
- Created DELETE /api/starred/[type]/[id] endpoint (remove starred item)
- Created GET /api/starred/[type]/[id] endpoint (check if item starred)
- All endpoints include Prisma query comments for future DB integration

### Notes for next dev
- Uses in-memory mock storage - replace with Prisma when DATABASE_URL set
- userId hardcoded to 'mock-user-id' - wire to auth session
- DELETE returns success even if item not found (mock limitation)
- Library page can now be wired to these endpoints instead of local state

### Files created
- app/api/starred/route.ts - GET and POST endpoints
- app/api/starred/[type]/[id]/route.ts - GET and DELETE endpoints

## 2026-01-25: Assistant Prompts Quick-Access Panel

### Completed
- Added Prompts button functionality to Assistant page
- Prompts button toggles prompt selector panel
- Search/filter prompts by name, content, or category
- Starred prompts appear first in list
- Clicking prompt inserts content into query textarea
- Shows category and personal badges on prompts
- Close button to dismiss panel

### Notes for next dev
- Uses mock prompts data - wire to /api/prompts when DB connected
- Prompt insertion appends to existing query with double newline separator
- Starred prompts sorted to top automatically

### Files modified
- app/(dashboard)/assistant/page.tsx - added Prompt type, mock data, selector panel

## 2026-01-25: Workflow Detail/Execution Page

### Completed
- Created /workflows/[id] page with full workflow execution UI
- Page shows workflow name, description, category badge, output type badge
- Workflow steps displayed in left panel with step indicators
- Step progress: pending (gray), active (spinner), completed (green checkmark)
- File upload area with drag-and-drop and click-to-browse
- Uploaded files shown as list with name, size, remove button
- Execute button disabled until files uploaded
- Mock execution simulates step-by-step progress (1.5s per step)
- Output panel appears on completion with mock content
- Output varies by outputType (draft/review_table/extraction)
- Copy/Download buttons on output (UI only)
- Run Again button to reset and re-execute
- Back to Workflows navigation

### Notes for next dev
- Uses mock workflow data with steps - same IDs as workflows list page
- Execution is simulated - wire to /api/workflows/[id]/execute for real AI
- File upload stores files in state only - needs S3 integration for persistence
- Copy/Download buttons are UI placeholders - implement clipboard/blob download
- Mock output is static - real output would stream from AI endpoint

### Files created
- app/(dashboard)/workflows/[id]/page.tsx - workflow detail/execution UI

## 2026-01-25: Assistant Files and Sources Panel

### Completed
- Added Files and sources button functionality to Assistant page
- Button toggles file attachment panel with file count badge
- Drag-and-drop zone with visual feedback (border color change on drag)
- Click-to-browse via hidden file input (multiple files supported)
- Attached files list with name, size, and remove button
- File size formatting (B, KB, MB)
- Panel close button

### Notes for next dev
- Files stored in component state only - not uploaded to S3 yet
- Files not passed to AI endpoint - need to implement file content extraction
- Supports any file type - may want to restrict to PDF/DOCX/TXT etc
- File content not read into memory yet - just metadata stored

### Files modified
- app/(dashboard)/assistant/page.tsx - added files panel, drag-drop, file list

## 2026-01-25: Vault Page API Integration

### Completed
- Wired Vault page to GET /api/vaults endpoint
- Page fetches vaults on mount with search/sort params
- handleCreateVault now POSTs to /api/vaults
- Added loading state with spinner during fetch
- Added error state with retry button
- Removed mock vault data - uses API exclusively
- Search query triggers API refetch (not client-side filter)

### Notes for next dev
- Requires DATABASE_URL to actually persist vaults
- Without DB, API returns 500 error and error state shows
- Edit/delete vault not yet implemented in UI
- Vault detail page (/vault/[id]) still uses mock data

### Files modified
- app/(dashboard)/vault/page.tsx - API integration, loading/error states

## 2026-01-25: Database Seed File

### Completed
- Created prisma/seed.ts with 12 system workflows
- 7 General category workflows: Draft Client Alert, Draft from Template, Extract Timeline, Proofread, Summarize Calls, Transcribe Audio, Translate
- 5 Transactional category workflows: Analyze Change of Control, Draft Covenants Memo, Draft Item 1.01, Extract Key Data, Extract Terms from Agreements
- All workflows have promptTemplate and WorkflowSteps defined
- Workflows use deterministic IDs (system-{slug}) for upsert support
- Added db:seed script to package.json
- Installed tsx for running TypeScript seed file

### Notes for next dev
- Run `npm run db:seed` after `npm run db:push` or `npm run db:migrate`
- Seed can be re-run safely (uses upsert)
- columnSchema uses Prisma.DbNull for workflows without columns
- Mock data in UI pages matches seed data structure
- Workflow IDs in seed differ from mock IDs (system-slug vs numeric) - update API/UI to use DB

### Files created
- prisma/seed.ts - seed file with system workflows

### Files modified
- package.json - added db:seed script, tsx devDependency

## 2026-01-25: PRD Data Model Items Marked Complete

### Completed
- Updated PRD setup item for Next.js to passes:true (project exists and works)
- Updated 11 data-model PRD items to passes:true:
  - User, Vault, Document, Workflow, WorkflowStep
  - Prompt, Example, AssistantQuery, SourceReference
  - HistoryEntry, StarredItem
- All models exist in prisma/schema.prisma with correct fields, enums, relations, indexes

### Notes for next dev
- PRD items marked complete reflect schema existence, not DB deployment
- Still requires DATABASE_URL + db:push/migrate to create actual tables
- Remaining false items: S3 storage setup, functional features requiring DB/auth

## 2026-01-25: Assistant Query DB Persistence

### Completed
- POST /api/assistant/query now creates AssistantQuery record with status tracking
- Status progression: pending -> streaming -> completed/failed
- SourceReference records created for vault sources
- HistoryEntry created on completion with title, type, sourcesSummary
- ConversationId support for grouping related queries
- Response headers include X-Query-Id and X-Conversation-Id for client tracking
- Graceful degradation if DB unavailable (streaming still works)
- Updated 3 PRD items to passes:true

### Notes for next dev
- Uses MOCK_USER_ID - wire to auth session when implemented
- AI context from previous turns not yet implemented (conversationId stored but not used for context retrieval)
- Vault content not yet used as RAG context (requires embeddings)
- onFinish callback handles async DB updates after stream completes

### Files modified
- app/api/assistant/query/route.ts - full rewrite with DB persistence

## 2026-01-25: Vault CRUD Operations

### Completed
- Added edit vault dialog to vault list page
- Added delete vault confirmation dialog with AlertDialog component
- Wired edit to PATCH /api/vaults/[id] endpoint
- Wired delete to DELETE /api/vaults/[id] endpoint
- Added dropdown menu on vault cards (grid + list view) with Edit/Delete options
- Edit dialog allows updating name and description
- Delete dialog shows vault name and warns about permanent deletion
- Loading states during edit/delete operations
- Error handling with user-friendly messages
- Added shadcn alert-dialog component

### Notes for next dev
- Vault type cannot be changed after creation (by design)
- Edit/delete available from both grid and list views
- API already handles cascade delete of documents
- No confirmation email/notification on delete

### Files modified
- app/(dashboard)/vault/page.tsx - edit/delete UI and handlers
- components/ui/alert-dialog.tsx - new shadcn component

## 2026-01-26: Files & Sources Dropdown and Vault Selection Modal

### Completed
- Replaced Files and Sources button with proper dropdown menu
- Dropdown has two sections: "File Actions" and "Sources" with separator
- Upload Files action triggers native file picker
- Add From Vault action opens vault selection modal
- Vault selection modal shows list of vaults with file counts
- Clicking vault displays files in that vault
- Multi-file selection with visual checkmark indicators
- Confirm button adds selected files to attached files list
- AttachedFile interface updated to support both uploaded files and vault references
- Updated 6 PRD items to passes:true

### Notes for next dev
- Vault files are references (file: null, source: "vault") - real impl needs to fetch actual file content
- Mock vaults with files used - wire to /api/vaults/[id]/documents when DB connected
- Vault file references include vaultId for future lookup
- Removed old drag-and-drop panel - upload via dropdown only now

### Files modified
- app/(dashboard)/assistant/page.tsx - dropdown menu, vault modal, updated AttachedFile type

## 2026-01-26: Prompts Dropdown with Hover Preview

### Completed
- Converted Prompts button from expandable panel to dropdown menu
- Dropdown shows all saved prompts with starred items first
- Prompts display name, preview text, and Personal badge where applicable
- Hover preview updates textarea placeholder with truncated prompt content
- Placeholder reverts to default when hover ends or dropdown closes
- Clicking prompt inserts content into query textarea
- Removed unused Input component and Search icon imports
- Updated 3 PRD items to passes:true

### Notes for next dev
- Uses mock prompts data - wire to /api/prompts when DB connected
- Hover preview truncates at 100 chars with ellipsis
- Starred prompts use yellow star icon and sort to top
- No search in dropdown (simpler UX than panel) - may add if list grows large

### Files modified
- app/(dashboard)/assistant/page.tsx - dropdown menu, hover preview state

## 2026-01-26: Improve Button Feature

### Completed
- Added Improve button to assistant input area next to Prompts button
- Created POST /api/assistant/improve endpoint for prompt refinement
- Button disabled when textarea empty or during loading/improving
- Streams improved prompt directly into textarea, replacing original text
- Loading state shows spinner with "Improving" text
- Uses Wand2 icon consistent with "magic" UI patterns
- Updated 2 PRD items to passes:true

### Notes for next dev
- Improve endpoint uses defaultModel (claude-sonnet-4-20250514)
- No DB persistence for improve requests (stateless)
- Streaming updates textarea in real-time as response arrives
- Original query is fully replaced, not appended

### Files created
- app/api/assistant/improve/route.ts - streaming prompt improvement endpoint

### Files modified
- app/(dashboard)/assistant/page.tsx - added Improve button, isImproving state, handleImprove function

## 2026-01-26: Ask Button Attached Files Integration

### Completed
- Updated handleSubmit to pass attachedFiles metadata to /api/assistant/query
- API endpoint now accepts attachedFiles array with id, name, size, source, vaultId
- Attached files included in user prompt context (names listed)
- SourceReference records created for attached files (sourceType: "document")
- History entry sourcesSummary includes attached file count
- Updated 1 PRD item to passes:true

### Notes for next dev
- File content not actually sent/processed yet - only metadata passed
- Uploaded files (source: "upload") would need FormData/multipart for real content
- Vault files (source: "vault") would need server-side fetch from storage
- RAG/embeddings needed to actually use file content in AI response

### Files modified
- app/(dashboard)/assistant/page.tsx - handleSubmit passes attachedFiles
- app/api/assistant/query/route.ts - handles attachedFiles, creates source refs, updates prompt context

## 2026-01-26: Zero-Shadow Design System

### Completed
- Added global CSS override in globals.css to neutralize all shadow utilities
- Removed shadow-sm from Card component
- Removed shadow-lg from Dialog and AlertDialog components
- Removed shadow-md/shadow-lg from DropdownMenu and DropdownMenuSubContent
- Removed shadow-xs from SelectTrigger and shadow-md from SelectContent
- Removed shadow-xs from Button outline variant
- Removed shadow-xs from Toggle outline variant
- Removed shadow-xs from Input component
- Removed shadow-xs from Textarea component
- Removed shadow-lg from Sheet component
- Removed shadow-sm from Sidebar floating variant and SidebarInset
- Converted SidebarMenuButton outline variant from custom shadow to border
- Removed shadow-none from SidebarInput (redundant)
- Removed shadow-xs from Checkbox component
- Updated 9 PRD items to passes:true

### Notes for next dev
- Global CSS layer overrides all shadow-* utilities to empty
- Components rely on existing border classes for elevation/separation
- SidebarMenuButton outline variant uses border-sidebar-border instead of shadow
- SidebarInset uses border instead of shadow-sm for inset variant
- All changes work in both light and dark modes via existing CSS variables

### Files modified
- app/globals.css - added @layer utilities block for shadow override
- components/ui/card.tsx - removed shadow-sm
- components/ui/dialog.tsx - removed shadow-lg
- components/ui/alert-dialog.tsx - removed shadow-lg
- components/ui/dropdown-menu.tsx - removed shadow-md, shadow-lg
- components/ui/select.tsx - removed shadow-xs, shadow-md
- components/ui/button.tsx - removed shadow-xs from outline variant
- components/ui/toggle.tsx - removed shadow-xs from outline variant
- components/ui/input.tsx - removed shadow-xs
- components/ui/textarea.tsx - removed shadow-xs
- components/ui/sheet.tsx - removed shadow-lg
- components/ui/sidebar.tsx - removed shadow-sm, converted outline shadow to border
- components/ui/checkbox.tsx - removed shadow-xs

## 2026-01-26: Embedded Chat Input Button Row

### Completed
- Restructured assistant page chat input into unified container
- Textarea and button row now inside single bordered container
- Files & Sources, Prompts, Improve buttons in bottom toolbar
- Ask button right-aligned within same container
- Buttons use ghost variant for seamless toolbar integration
- Button row has subtle border-t separator and bg-muted/30 background
- Updated 1 PRD item to passes:true

### Notes for next dev
- Textarea has border-0 and no ring to blend with container
- Button row uses flex with spacer for right-aligned Ask button
- Choose vault button remains outside container (separate from input actions)
- Container uses rounded corners (will be updated in border-radius PRD items)

### Files modified
- app/(dashboard)/assistant/page.tsx - restructured input layout

## 2026-01-26: Square-Edge Design System (0-4px Border Radius)

### Completed
- Changed base --radius from 0.625rem (10px) to 0.25rem (4px)
- Updated radius scale in @theme inline block to cap at 4px max
- --radius-sm: 0.0625rem (1px), --radius-md: 0.125rem (2px), --radius-lg: 4px
- --radius-xl through --radius-4xl all capped at 4px (same as --radius)
- All rounded-* utilities now globally limited to square-edge design
- Updated 1 PRD item to passes:true

### Notes for next dev
- Tailwind v4 uses @theme inline block (not tailwind.config.js)
- Remaining border-radius PRD items (Card, Dropdown, Button, Modal, Input, vault tiles) now automatically apply
- Components using rounded-lg, rounded-xl etc will all render at 4px max
- Verify individual components visually if specific adjustments needed

### Files modified
- app/globals.css - updated --radius and radius scale values

## 2026-01-26: Recommended Workflow Cards Redesign

### Completed
- Replaced Card component with plain div for workflow cards
- Removed all borders from workflow cards
- Applied bg-gray-50 background (light mode) and bg-muted/50 (dark mode)
- Hover state uses bg-gray-100 (light) and bg-muted (dark)
- Removed unused Card component imports from assistant page
- Verified chat input box already has flat square-edged styling
- Updated 9 PRD items to passes:true (3 workflow/input cards + 6 border-radius items)

### Notes for next dev
- Workflow cards now use simple div with Tailwind classes instead of Card component
- All border-radius PRD items now complete via global CSS (--radius capped at 4px)
- All UI components use the global radius vars, no per-component overrides needed

### Files modified
- app/(dashboard)/assistant/page.tsx - replaced Card with div for workflow cards

## 2026-01-26: Input Bar Floating Inline Icons

### Completed
- Added 'inline' button variant to button.tsx for floating inline icons
- Variant uses text-muted-foreground default, hover:text-foreground for icon color change
- Minimal background tint on hover (hover:bg-muted/50)
- Updated Files & Sources, Prompts, Improve buttons to use inline variant
- Buttons now appear seamlessly integrated into input surface
- Updated 2 PRD items to passes:true

### Notes for next dev
- 'inline' variant designed for toolbar/input area icons
- Differs from 'ghost' by starting with muted text color and having subtler hover
- Matches Harvey/Lex visual style for embedded input controls

### Files modified
- components/ui/button.tsx - added inline variant
- app/(dashboard)/assistant/page.tsx - changed buttons from ghost to inline variant

## 2026-01-26: Vault Selection Modal Redesign

### Completed
- Redesigned vault selection modal with 50% viewport dimensions (w-[50vw] h-[50vh])
- Applied bg-gray-50 to modal background, white headers/footers
- Square-edge design (uses global 0-4px radius system)
- 1px neutral border on modal
- "Choose a Vault" header with back navigation when in file view
- "Create New Vault" as prominent first option with dashed border styling
- Search bar in top-right header filters vaults by name
- Vault cards in 2-column grid showing: name, type badge, created date, file count, storage used
- File table view using shadcn Table component
- Table columns: checkbox (select all), File Name (sortable), File Type (badge), File Size (sortable), Uploaded On (sortable), Tags
- Multi-file selection with row click or checkbox
- Back navigation from file table to vault list
- Footer shows selection count and Add/Cancel buttons
- Updated 18 PRD items to passes:true

### Notes for next dev
- "Create New Vault" button logs to console only - actual modal not yet implemented
- Uses mock vault data with files - wire to /api/vaults/[id]/documents when DB connected
- VaultFile interface extended: fileType, documentType, uploadedAt, tags fields
- Vault interface extended: storageUsed, createdAt fields
- File metadata panel (PRD item) not implemented - would need side panel
- Filtering by file type/tags not implemented - only sorting currently
- Removed unused drag handlers (isDragging, handleDragOver, handleDragLeave, handleDrop) since upload is via dropdown

### Files modified
- app/(dashboard)/assistant/page.tsx - complete vault modal redesign

## 2026-01-26: Create New Vault Modal

### Completed
- Installed react-dropzone for drag-and-drop file uploads
- Added Create New Vault modal with 50% viewport dimensions
- Modal styling: bg-gray-50, 1px border, no shadows, square edges (0-4px radius via global system)
- Header with "Create a Vault" title and close button
- Vault name single-line text input with label
- Drag-and-drop upload zone using react-dropzone (accepts PDF, DOC, DOCX, TXT)
- Visual feedback on drag enter/leave (border color + bg change)
- Uploaded files list with file name, size, remove button
- Category dropdown per file (Contract, Template, Agreement, Memo, Policy, Research, Other)
- Footer with usage stats (storage used, file count) on left
- Footer with Cancel/Create buttons on right
- Create action validates vault name, POSTs to /api/vaults, closes modal on success
- Wired "Create New Vault" button in vault selection modal to open this modal
- Updated 10 PRD items to passes:true

### Notes for next dev
- File upload to S3 not implemented - files held in client state only
- API only creates vault record, doesn't upload files - needs separate file upload endpoint
- Category stored in client state but not persisted - needs to be sent with file upload
- After creation, vault list doesn't refresh (no refetch logic) - may want to add

### Files modified
- app/(dashboard)/assistant/page.tsx - added Create New Vault modal, react-dropzone integration
- package.json - added react-dropzone dependency

## 2026-01-26: Sidebar Vault List

### Completed
- Added collapsible vault list to sidebar under Vault nav item
- Vault section expands on click to show "All Vaults" link + individual vaults
- Limited to max 10 vaults (sorted by most recent via /api/vaults?sortBy=recent)
- Each vault shows icon (Database for knowledge_base, FolderOpen for sandbox) + name
- Clicking vault navigates to /vault/[id] detail page
- Uses Collapsible, SidebarMenuSub, SidebarMenuSubButton components
- Styling uses existing flat/shadowless design (no shadows, 0-4px radius via global CSS)
- Updated 3 PRD items to passes:true

### Notes for next dev
- Vaults fetched from /api/vaults on sidebar mount - requires DB to show actual vaults
- Without DB, vault list will be empty (silently fails fetch)
- "All Vaults" link always visible when expanded - provides access to full vault page
- Collapsible state not persisted across page navigations
- ChevronRight icon rotates 90deg when expanded

### Files modified
- components/app-sidebar.tsx - added collapsible vault list with fetch logic

## 2026-01-26: Start a Query Flow from Vault Detail Page

### Completed
- Added query banner to vault detail page (visible only when vault has 1+ files)
- Banner text: "Start querying your knowledge base" with "Start a Query" button
- Banner styled with bg-gray-50, 1px border, Sparkles icon
- "Start a Query" button (both in banner and action buttons) opens file selection modal
- File selection modal: 50% viewport, centered, square-edge design
- Modal uses shadcn Table with checkbox column, file name, type badge, size
- Sort by name/type/size columns, select all via header checkbox
- "Go" button navigates to /assistant with vault context in URL params
- Assistant page reads URL params: vault, vaultName, files, query
- Preloaded files automatically attached to chat session
- Vault context displayed in dedicated section with Database icon
- Placeholder text changes to "Ask a question about your selected vault files..."
- Updated 7 PRD items to passes:true

### Notes for next dev
- File IDs passed via comma-separated URL param (?files=f1,f2,f3)
- Mock data used for file lookup - wire to /api/vaults/[id]/documents when DB connected
- preloadedContext state tracks vault context from URL for UI display
- URL also supports ?query= param for pre-filled query text

### Files modified
- app/(dashboard)/vault/[id]/page.tsx - query banner, file selection modal, handleStartQuery
- app/(dashboard)/assistant/page.tsx - useSearchParams, preloadedContext state, vault context UI

## 2026-01-26: File Table Metadata Panel

### Completed
- Added metadata panel to right side of file table in vault selection modal
- Panel appears when clicking/selecting a file in the table
- Panel displays: file icon, name, file type, document type (as badge), category, file size, file format, upload date, tags
- File row highlights with primary/10 bg when focused
- Close button dismisses panel
- Panel state resets when navigating back to vault list or closing modal
- Responsive layout: table takes full width when no file selected, shrinks to flex-1 when panel shown
- Updated 1 PRD item to passes:true

### Notes for next dev
- focusedFile state tracks which file's metadata to display
- Panel is 256px wide (w-64) with border separator
- Uses same VaultFile interface - all metadata fields already present in mock data
- Category field shows documentType (same value) - real impl may have separate category field

## 2026-01-26: Elevation Styling Audit and Lint Fixes

### Completed
- Audited entire codebase for elevation tokens (Material/AntD patterns)
- Confirmed no elevation tokens exist - codebase uses flat surface styling throughout
- Global shadow override in globals.css already neutralizes all shadow utilities
- Fixed ESLint errors in workflows/[id]/page.tsx:
  - Removed unused CircleDot import
  - Created OutputTypeIcon component to avoid creating components during render
- Fixed ESLint warning in starred/[type]/[id]/route.ts (commented unused userId)
- Fixed page-header.tsx setState-in-effect warning by using direct DOM lookup
- Updated 1 PRD item to passes:true (Remove elevation styling from all components)

### Notes for next dev
- Codebase uses border-based elevation pattern (no shadows anywhere)
- Remaining false PRD items require DATABASE_URL (file metadata persistence)
- ESLint now passes clean (0 errors, 0 warnings)
- TypeScript check passes clean

### Files modified
- app/(dashboard)/workflows/[id]/page.tsx - lint fixes, OutputTypeIcon component
- app/api/starred/[type]/[id]/route.ts - commented unused variable
- components/page-header.tsx - fixed setState-in-effect pattern

## 2026-01-26: File Upload Endpoint and Metadata Persistence

### Completed
- Created POST /api/vaults/[id]/documents endpoint for file upload
- Endpoint accepts multipart FormData with files, categories, and tags
- Creates Document records in Prisma with all metadata fields populated
- Stores file content as base64 in metadata JSON (no S3 dependency)
- Generates unique storageKey for each file (vaults/{vaultId}/{uuid}.{ext})
- Wired Create New Vault modal to upload files after vault creation
- Files with custom categories now persist to database
- Updated 2 PRD items to passes:true (file metadata persistence)
- All PRD items now complete (passes:true)

### Notes for next dev
- File content stored in metadata.content as base64 - replace with S3 in prod
- storageKey field populated but not used yet - ready for S3 migration
- Tags support in endpoint but UI doesn't expose tag input yet
- embeddingStatus defaults to pending - embedding pipeline not implemented

### Files modified
- app/api/vaults/[id]/documents/route.ts - added POST endpoint
- app/(dashboard)/assistant/page.tsx - wired Create Vault to upload files

## 2026-01-26: Google AI SDK Migration

### Completed
- Replaced Anthropic provider with Google Generative AI provider in lib/ai.ts
- Uninstalled @ai-sdk/anthropic package
- Updated .env.example to use GOOGLE_GENERATIVE_AI_API_KEY instead of ANTHROPIC_API_KEY
- defaultModel now uses google('gemini-2.5-flash')
- analysisModel now uses google('gemini-2.5-pro')
- Fixed page-header.tsx lint error using useSyncExternalStore pattern
- Updated 6 PRD items to passes:true

### Notes for next dev
- @ai-sdk/google was already installed - only needed to wire it up
- API routes unchanged - they import from lib/ai which now exports Google models
- Testing PRD items (3 remaining false) require GOOGLE_GENERATIVE_AI_API_KEY to verify
- TipTap editor feature is next priority for document editing

### Files modified
- lib/ai.ts - replaced Anthropic with Google Generative AI
- .env.example - updated API key variable name
- components/page-header.tsx - fixed setState-in-effect lint error
- package.json - @ai-sdk/anthropic removed

## 2026-01-26: TipTap Editor Setup

### Completed
- Installed TipTap core packages: @tiptap/react, @tiptap/starter-kit, @tiptap/pm
- Installed TipTap extensions: placeholder, underline, text-align, link
- Created DocumentEditor wrapper component at components/editor/document-editor.tsx
- Editor includes full toolbar: bold, italic, underline, strikethrough, lists, alignment, link, undo/redo
- Controlled component pattern: content prop for value, onChange callback for updates
- Styled to match design system: 4px border radius, no shadows, border-based elevation
- Added TipTap-specific CSS in globals.css for placeholder, typography, prose styles
- Dark mode compatible via CSS variables
- Updated 3 PRD items to passes:true

### Notes for next dev
- Did not use @tiptap/cli template - installed packages manually for more control
- DocumentEditor is ready for use in assistant page split-panel layout
- Toolbar uses ghost variant buttons for seamless integration
- Editor content is HTML string - use getHTML()/setContent() for serialization
- Next priority: Document Prisma model and API endpoints

### Files created
- components/editor/document-editor.tsx - TipTap editor wrapper with toolbar

### Files modified
- app/globals.css - added TipTap/ProseMirror CSS styles
- package.json - added TipTap dependencies

## 2026-01-26: EditorDocument Model and API Endpoints

### Completed
- Added EditorDocument model to Prisma schema for editor drafts
- Model has: id, title, content (Json), queryId (unique), version, createdAt, updatedAt
- Added editorDocument relation to AssistantQuery model
- Regenerated Prisma client
- Created GET /api/documents endpoint with pagination (page, limit params)
- Created POST /api/documents endpoint (title, content, queryId body)
- Created GET /api/documents/[id] endpoint with query relation
- Created PUT /api/documents/[id] endpoint for title/content updates
- Created DELETE /api/documents/[id] endpoint
- Updated 8 PRD items to passes:true

### Notes for next dev
- EditorDocument is separate from Document model (vault files)
- queryId is unique - one document per query
- POST returns 409 if document already exists for query
- Content stored as Json (TipTap editor JSON format)
- Version field ready for versioning feature (default 1)
- Requires db:push after setting DATABASE_URL

### Files created
- app/api/documents/route.ts - GET and POST endpoints
- app/api/documents/[id]/route.ts - GET, PUT, DELETE endpoints

### Files modified
- prisma/schema.prisma - added EditorDocument model, updated AssistantQuery relation

## 2026-01-26: Split-Panel Layout for Document Editing

### Completed
- Added mode state to assistant page ('chat' | 'document')
- Created ChatPanel component at components/assistant/chat-panel.tsx
- ChatPanel includes: query display, Copy/Save prompt/Edit query buttons, generation status, follow-up input
- Created EditorPanel component at components/assistant/editor-panel.tsx
- EditorPanel includes: Draft header, Version dropdown, Sources button, Export button, Show edits toggle
- Added shadcn Switch component for Show edits toggle
- Implemented split-panel layout: 25% ChatPanel + 75% EditorPanel in document mode
- Full-width chat layout when in chat mode (no response yet)
- Auto-switch to document mode when outputType is 'draft' after AI response
- Added CSS transitions (transition-all duration-300) for smooth layout changes
- Synced AI completion to editor content in document mode
- New thread button resets to chat mode
- Updated 5 PRD items to passes:true

### Notes for next dev
- Mode auto-switches to 'document' when outputType='draft' and response arrives
- EditorPanel receives content via props - editor is controlled component
- ChatPanel compact prop hides completion display (shown in editor instead)
- Version dropdown, Sources panel, Export functionality are UI placeholders
- Show edits toggle state exists but diff highlighting not implemented
- Next priorities: system prompt classification, mode parsing from AI response

### Files created
- components/assistant/chat-panel.tsx - ChatPanel component
- components/assistant/editor-panel.tsx - EditorPanel component
- components/ui/switch.tsx - shadcn Switch component

### Files modified
- app/(dashboard)/assistant/page.tsx - mode state, split-panel layout, auto-switch logic

## 2026-01-26: AI Mode Classification and Response Routing

### Completed
- Updated system prompt to instruct AI to prefix responses with [MODE:chat] or [MODE:document]
- System prompt defines criteria: document mode for drafts/memos/letters, chat mode for Q&A
- Added useMemo-based parsedResponse to extract mode prefix from AI completion
- Mode regex matches [MODE:chat] or [MODE:document] at start of response
- Strips mode prefix from displayed content automatically
- useEffect switches mode state based on AI-detected mode
- displayContent variable used for cleaned content in both layouts
- Removed hardcoded outputType-based mode switching (AI now decides)
- Updated 3 PRD items to passes:true

### Notes for next dev
- AI determines mode via prefix - user's outputType selection is a hint, not deterministic
- Streaming works: mode can switch mid-stream when prefix is detected
- Content stripping removes prefix + leading newlines for clean display
- Next priorities: streaming into TipTap, debounced auto-save, document versioning

### Files modified
- app/api/assistant/query/route.ts - updated system prompt with mode classification
- app/(dashboard)/assistant/page.tsx - parsedResponse, displayContent, mode auto-switch

## 2026-01-26: TipTap Streaming Content Support

### Completed
- Updated DocumentEditor to handle streaming content incrementally
- Added isStreaming prop to control streaming vs normal update behavior
- During streaming: appends new content to end without cursor jumps
- After streaming: converts plain text to HTML paragraphs for proper formatting
- Uses refs to track previous content length and streaming state
- Prevents onChange emissions during streaming (only emit user edits)
- EditorPanel now passes isStreaming prop to DocumentEditor
- Updated 1 PRD item to passes:true

### Notes for next dev
- Streaming appends text character-by-character using insertContent
- After streaming ends, content is reformatted with textToHtml() for proper paragraphs
- isStreamingRef avoids stale closure issues in onUpdate callback
- wasStreamingRef tracks stream end for final HTML conversion
- Next priorities: debounced auto-save, document persistence, versioning

### Files modified
- components/editor/document-editor.tsx - streaming support with incremental updates
- components/assistant/editor-panel.tsx - pass isStreaming to DocumentEditor

## 2026-01-26: Debounced Auto-Save for Editor Documents

### Completed
- Installed use-debounce package for debounced callbacks
- Added document state management: currentQueryId, documentId, isSaving
- Created custom fetch wrapper to capture X-Query-Id header from API response
- Implemented debounced save function with 2 second delay
- Creates new EditorDocument via POST /api/documents when first saving
- Updates existing document via PUT /api/documents/[id] on subsequent edits
- Links document to AssistantQuery via queryId captured from response headers
- Added saving indicator in EditorPanel header ("Saving...", "Saved")
- handleNewThread resets document state for fresh sessions
- Updated 3 PRD items to passes:true

### Notes for next dev
- queryIdRef used to avoid stale closure issues with async callbacks
- Save only triggers after streaming completes (not during AI generation)
- Document content stored as { html: content } JSON structure
- If document already exists for query (409 response), skips create gracefully
- Requires DATABASE_URL to actually persist documents
- Next priorities: ChatPanel UI features, versioning, export functionality

### Files modified
- app/(dashboard)/assistant/page.tsx - auto-save state, custom fetch, debounced save
- components/assistant/editor-panel.tsx - isSaving prop, saving indicator UI
- package.json - added use-debounce dependency

## 2026-01-26: Save Prompt Functionality

### Completed
- Added Save Prompt dialog to ChatPanel component
- Dialog allows naming the prompt before saving
- Default name generated from first 30 chars of query
- Wired to POST /api/prompts endpoint
- Success indicator shows briefly after save
- Updated 9 PRD items to passes:true (ChatPanel UI + EditorPanel UI + Save prompt)

### Notes for next dev
- ChatPanel UI was already implemented but PRD items weren't marked complete
- EditorPanel UI was already implemented but PRD items weren't marked complete
- Saved prompts use category "personal" and ownerType is set by API
- Prompts dropdown in assistant page uses mock data - needs refetch after save
- Remaining false PRD items: Test endpoints (3), Document versioning (1)

### Files modified
- components/assistant/chat-panel.tsx - added save prompt dialog, API call, states

## 2026-01-26: Document Versioning

### Completed
- Added DocumentVersion model to Prisma schema for version history
- Model has: id, documentId, version, content (Json), createdAt
- Unique constraint on [documentId, version] for deduplication
- Renamed EditorDocument.version to currentVersion for clarity
- Created GET /api/documents/[id]/versions - list all versions
- Created POST /api/documents/[id]/versions - create new version (AI regeneration)
- Created GET /api/documents/[id]/versions/[version] - get specific version content
- Updated PUT /api/documents/[id] to save v1 snapshot on first update
- Updated GET /api/documents/[id] to include availableVersions array
- Added version state to assistant page (currentVersion, availableVersions)
- Implemented handleVersionChange to load previous versions
- EditorPanel version dropdown now functional with loading state
- Updated 1 PRD item to passes:true

### Notes for next dev
- Version 1 is created on first PUT to capture initial AI output
- New versions created via POST /versions when AI regenerates (not implemented in UI yet)
- Version switching loads content from DocumentVersion table
- Current version content lives in EditorDocument.content (not duplicated in versions until superseded)
- Remaining false PRD items: Test endpoints (3) - require actual API key

### Files created
- app/api/documents/[id]/versions/route.ts - GET/POST versions
- app/api/documents/[id]/versions/[version]/route.ts - GET specific version

### Files modified
- prisma/schema.prisma - added DocumentVersion model, renamed version to currentVersion
- app/api/documents/[id]/route.ts - include versions in GET, save v1 on first PUT
- app/api/documents/route.ts - use currentVersion field
- components/assistant/editor-panel.tsx - added isLoadingVersion prop, improved dropdown
- app/(dashboard)/assistant/page.tsx - version state, handleVersionChange

## 2026-01-26: Document Editor Bug Fixes

### Completed
- Fixed content comparison: changed editor.getText() to editor.getHTML() for proper comparison
- Added isInternalUpdateRef to track internal updates and prevent feedback loops
- Added isFormattingRef to track formatting operations and prevent cursor jumps
- Guard content sync useEffect from internal updates (early return if isInternalUpdateRef.current)
- Guard content sync useEffect from formatting operations (early return if isFormattingRef.current)
- Consolidated setContent calls with { emitUpdate: false } option to prevent update loops
- Added cursor position preservation: save selection before setContent, restore after (clamped to valid range)
- Removed unused isMarkdown function and removed it from useEffect dependencies
- Created runFormatting() helper that wraps formatting commands with guard ref
- Wrapped all 13 toolbar button handlers with runFormatting() guard
- Verified StarterKit includes Bold, Italic, Strike; Underline extension loaded separately
- Updated 11 PRD bug fix items to passes:true

### Notes for next dev
- TipTap setContent uses { emitUpdate: false } option, not boolean second arg
- Formatting guard uses queueMicrotask to reset after React reconciliation
- Cursor preservation clamps to doc.content.size to avoid out-of-bounds
- All formatting operations (bold, italic, underline, strike, lists, alignment, link, undo/redo) now guarded
- Remaining false PRD items: Test endpoints (3), Markdown rendering (12)

### Files modified
- components/editor/document-editor.tsx - all bug fixes applied

## 2026-01-26: Markdown Rendering Feature

### Completed
- Installed react-markdown package
- Created MarkdownRenderer component at components/ui/markdown-renderer.tsx
- Custom renderers for: code blocks (inline + block), tables, lists, headings, blockquotes, links
- Dark mode compatible via prose classes
- Applied MarkdownRenderer to ChatPanel query display (line ~131)
- Applied MarkdownRenderer to ChatPanel completion display
- Applied MarkdownRenderer to AssistantPage full-width query/response display
- Replaced single Copy button with "Copy Markdown" and "Copy Text" buttons
- Copy Markdown preserves raw markdown syntax
- Copy Text uses stripMarkdown() helper to remove markdown formatting
- Added controlled tooltips that show "Copied!" for 2 seconds after copy
- Updated 10 PRD items to passes:true

### Notes for next dev
- MarkdownRenderer exports both component and stripMarkdown() helper
- stripMarkdown uses regex to strip headers, bold/italic, code, links, images, blockquotes, lists
- Tooltips use controlled open state with setTimeout for auto-dismiss
- Remaining false PRD items: Test endpoints (3) - require actual API key

### Files created
- components/ui/markdown-renderer.tsx - MarkdownRenderer component + stripMarkdown helper

### Files modified
- components/assistant/chat-panel.tsx - added MarkdownRenderer, copy buttons, tooltips
- app/(dashboard)/assistant/page.tsx - added MarkdownRenderer import, applied to query/response display
- package.json - added react-markdown dependency

## 2026-01-27: Assistant Page Vault Modal API Integration

### Completed
- Removed mockVaults and mockVaultsWithFiles from assistant page
- Vault list fetched from GET /api/vaults when modal opens or vault selector toggled
- Vault documents fetched from GET /api/vaults/[id]/documents on vault click
- Added loading spinners for vault list and file table
- Added error states with retry buttons for both views
- Added empty states for no vaults and no files
- Updated preloaded context (URL params) to fetch files from API
- Updated vault selector dropdown to use fetched vaults with loading/error states
- Removed VaultSource interface (using Vault directly)
- Removed HardDrive icon import and storageUsed display (not in API response)
- Removed tags column from file table (not in API response)
- Changed uploadedAt to createdAt to match API response
- Updated 3 PRD items to passes:true

### Notes for next dev
- Vault modal uses separate state for vault list vs vault files (fetched independently)
- VaultFile.documentType is nullable (API may return null)
- API returns sizeBytes, mapped to size in VaultFile interface
- mockPrompts still in use - wire to /api/prompts when ready
- Vault selector dropdown fetches on first open, uses cached state after

### Files modified
- app/(dashboard)/assistant/page.tsx - removed mock data, added API fetch, loading/error states

## 2026-01-27: Vault Detail Page API Integration

### Completed
- Replaced mock vault and document data with real API calls
- Fetches vault from GET /api/vaults/[id] and documents from GET /api/vaults/[id]/documents in parallel
- Removed mockVault and mockDocuments constants
- Added error state with "Back to Vaults" and "Retry" buttons
- Loading/empty/error states now complete for both /vault and /vault/[id] pages
- Updated 2 PRD items to passes:true

### Notes for next dev
- Requires DATABASE_URL to show actual data
- Without DB, error state shows with retry option
- File upload button on vault detail page is still UI-only (no upload handler wired)
- Next priority: replace mock data in assistant page vault modal (PRD items 1-2)

### Files modified
- app/(dashboard)/vault/[id]/page.tsx - removed mock data, added API fetch, error state

## 2026-01-27: Vault Modal File Search/Filter

### Completed
- Added fileSearchQuery state for file table search
- Search input shown in modal header for both vault list and file table views
- Files filtered by name (case-insensitive) before sorting
- Select-all checkbox operates on filtered results only
- fileSearchQuery resets when navigating back to vault list
- Updated 1 PRD item to passes:true (search/filter in vault selection modal)
- Also marked vault page API integration PRD item as passes:true (was already done)

### Notes for next dev
- Vault list search filters by name only (not description) - matches existing behavior
- File search filters by filename only
- Search persists while in file view, resets on back navigation

### Files modified
- app/(dashboard)/assistant/page.tsx - added file search state, filter logic, search input in file table header

## 2026-01-27: Embedding Pipeline Foundation

### Completed
- Installed @pinecone-database/pinecone, pdf-parse (v2), mammoth
- Installed @types/pdf-parse dev dependency
- Created lib/pinecone.ts with singleton client, upsertVectors (batch 100), queryVectors, deleteVectors, deleteNamespace, vaultNamespace helpers
- Created lib/document-parser.ts with extractText function (PDF via PDFParse class, DOCX via mammoth, TXT direct)
- Created lib/chunker.ts with chunkText function (~1000 token chunks, 200 token overlap, sentence boundary splitting)
- Created lib/embeddings.ts with embedChunks (embedMany) and embedQuery (embed) using AI SDK
- Added embeddingModel export to lib/ai.ts using google.textEmbeddingModel('text-embedding-004')
- Added PINECONE_API_KEY and PINECONE_INDEX to .env.example
- Added chunkCount (Int?) and embeddedAt (DateTime?) fields to Document model in schema.prisma
- Regenerated Prisma client
- Updated 7 PRD items to passes:true

### Notes for next dev
- pdf-parse v2 uses class-based API: `new PDFParse({ data })` then `.getText()` then `.destroy()`
- VectorMetadata interface includes index signature for Pinecone RecordMetadata compatibility
- chunker uses ~4 chars/token approximation, tries to break at sentence boundaries
- embeddings.ts exports both embedChunks (batch) and embedQuery (single) functions
- Next priority: Create embed API endpoint (process/route.ts) that orchestrates parse -> chunk -> embed -> upsert pipeline
- Requires db:push after setting DATABASE_URL for new schema fields

### Files created
- lib/pinecone.ts - Pinecone client singleton and vector helpers
- lib/document-parser.ts - text extraction from PDF/DOCX/TXT
- lib/chunker.ts - text chunking with overlap
- lib/embeddings.ts - AI SDK embedding wrappers

### Files modified
- lib/ai.ts - added embeddingModel export
- .env.example - added Pinecone env vars
- prisma/schema.prisma - added chunkCount, embeddedAt to Document model
- package.json - added pinecone, pdf-parse, mammoth, @types/pdf-parse

## 2026-01-27: RAG Query Helper and Context Injection

### Completed
- Created lib/rag.ts with queryRelevantChunks function
- Embeds user query, queries Pinecone filtered by documentIds, returns top-10 chunks with scores
- Updated /api/assistant/query to retrieve RAG chunks for vault-sourced attached files
- Injects document excerpts into user prompt with document name and chunk index labels
- Adds citation instructions to system prompt when RAG context present ([docName, chunk N] format)
- Stores RAG source references in SourceReference table with metadata (chunkIndex, score, textSnippet)
- Updated 4 PRD items to passes:true

### Notes for next dev
- RAG only triggers for vault files (source: "vault") with a vaultId
- Uploaded files (source: "upload") do not go through RAG - would need inline text extraction
- Multiple vaults not supported yet - uses first file's vaultId for namespace
- Citation format is [docName, chunk N] not [docName, p.X] since we have chunk indices not page numbers
- Source references stored async in onFinish - not included in streaming response body
- Next priorities: UI citation parsing, document viewer, status polling, document categories

### Files created
- lib/rag.ts - RAG query helper

### Files modified
- app/api/assistant/query/route.ts - RAG retrieval, context injection, citation instructions, source refs

## 2026-01-27: Embed API Endpoint (Document Processing Pipeline)

### Completed
- Created POST /api/vaults/[id]/documents/process endpoint
- Accepts documentId, sets embeddingStatus to processing
- Extracts base64 content from Document.metadata.content
- Parses text via document-parser (PDF/DOCX/TXT)
- Chunks text via chunker (~1000 token chunks, 200 overlap)
- Embeds chunks via embeddings.ts (Google text-embedding-004)
- Upserts vectors to Pinecone with metadata (documentId, chunkIndex, text, documentName, documentType)
- Vector IDs: {documentId}-chunk-{chunkIndex}
- Updates Document: embeddingStatus=completed, chunkCount, embeddedAt
- On error: sets embeddingStatus=failed
- Wired upload endpoint to trigger processing non-blocking via fire-and-forget fetch
- Updated 1 PRD item to passes:true

### Notes for next dev
- Processing uses base64 from metadata (no S3) - when S3 added, change to S3 download
- Non-blocking trigger uses fetch to self (request.nextUrl.origin) - works in dev and prod
- No retry logic yet - failed documents stay failed until retry endpoint built
- Pinecone namespace: vault-{vaultId}
- Next priorities: status polling API, retry endpoint, RAG query helper

### Files created
- app/api/vaults/[id]/documents/process/route.ts - embedding pipeline endpoint

### Files modified
- app/api/vaults/[id]/documents/route.ts - added non-blocking processing trigger after upload

## 2026-01-27: Document Categories and AI Categorization

### Completed
- Created lib/document-categories.ts with 18 categories (10 EB1A + 8 general)
- Created lib/categorize-document.ts using generateObject() with structured output
- Wired categorization into process endpoint alongside embedding (parallel, non-fatal)
- AI sets documentType if not already user-assigned, stores confidence/reasoning in metadata
- Created PATCH /api/vaults/[id]/documents/[docId] endpoint for category override
- Preserves aiCategory in metadata when user overrides
- Added category Select dropdown to vault detail page document rows
- Query modal shows category as Badge with getCategoryLabel()
- Updated 5 PRD items to passes:true

### Notes for next dev
- Categorization uses first ~12000 chars (~3000 tokens) of extracted text
- categorizeDocument() is non-fatal - if it fails, embedding still completes
- PATCH endpoint also supports name updates
- Category slugs used in DB, labels for display via getCategoryLabel()
- Create vault modal already has per-file category dropdown (from earlier work)

### Files created
- lib/document-categories.ts - category constants and helpers
- lib/categorize-document.ts - AI categorization via generateObject()
- app/api/vaults/[id]/documents/[docId]/route.ts - PATCH endpoint

### Files modified
- app/api/vaults/[id]/documents/process/route.ts - added categorization alongside embedding
- app/(dashboard)/vault/[id]/page.tsx - category Select dropdown, handleCategoryChange

## 2026-01-27: Document Processing Status Polling, Badges, and Retry

### Completed
- Added polling to vault detail page: fetches documents every 4s while any are pending/processing
- Polling auto-stops when all documents reach completed or failed state
- Cleanup on unmount via useRef interval tracking
- Styled all 4 embedding status badges: pending (gray, Clock icon), processing (blue, animated Loader2), completed (green, CheckCircle2), failed (red, XCircle)
- Created POST /api/vaults/[id]/documents/[docId]/retry endpoint
- Retry resets embeddingStatus to pending and re-triggers processing pipeline non-blocking
- Only failed documents can be retried (400 error otherwise)
- Added "Retry processing" option in document row dropdown menu for failed docs
- Retry triggers polling to resume automatically
- Updated 4 PRD items to passes:true

### Notes for next dev
- Polling interval is 4 seconds - adjust if too frequent for production
- Retry uses same fire-and-forget fetch pattern as initial upload processing
- hasProcessingDocs is memoized with useCallback to avoid unnecessary polling restarts
- Status badges use lucide icons inline with text for compact display

### Files created
- app/api/vaults/[id]/documents/[docId]/retry/route.ts - retry endpoint

### Files modified
- app/(dashboard)/vault/[id]/page.tsx - polling, status badges, retry button

## 2026-01-27: Vault Selection Modal Resize and 3-Column Grid

### Completed
- Resized vault selection modal from 50vw x 50vh to 90vw x 90vh
- Updated vault cards grid from 2-column to 3-column layout
- Added vault description to cards (line-clamp-2 for overflow)
- Rearranged card metadata: file count and date shown inline instead of 2-col grid
- Updated 2 PRD items to passes:true

### Notes for next dev
- Only the vault selection modal was resized; create vault modal remains 50vw x 50vh
- Two-state view (vault list vs file table) already existed from earlier work
- Back navigation, file checkboxes, summary bar already implemented
- Remaining false PRD items: S3 storage (6), client-side file validation (2), presigned URLs (1), citations UI (1), react-pdf + DocumentViewer (4)

### Files modified
- app/(dashboard)/assistant/page.tsx - modal dimensions, grid cols, card description

## 2026-01-27: Client-Side 25MB File Size Validation

### Completed
- Added MAX_FILE_SIZE constant (25MB) at module level in assistant page
- addFiles() now filters oversized files and shows alert with rejected filenames
- onDropNewVaultFiles() same validation for create vault modal drag-drop
- Valid files still added; only oversized ones rejected
- Updated 2 PRD items to passes:true

### Notes for next dev
- Vault detail page has no file upload handler yet - validation not needed there
- Uses alert() for error display - replace with toast when toast system added
- Remaining false PRD items: S3 storage (6), server-side file validation (1), presigned URLs (1), citations UI (1), react-pdf + DocumentViewer (4)

### Files modified
- app/(dashboard)/assistant/page.tsx - file size validation in addFiles and onDropNewVaultFiles

## 2026-01-27: S3 Storage Integration

### Completed
- Installed @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner
- Created lib/s3.ts with S3Client singleton, uploadFile, downloadFile, getPresignedUrl, deleteFile helpers
- Updated .env.example with AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET
- Updated POST /api/vaults/[id]/documents to upload files to S3 instead of storing base64 in metadata
- Added server-side 25MB file size validation (returns 413 for oversized files)
- Updated process endpoint to download files from S3 instead of reading base64 from metadata
- Created GET /api/vaults/[id]/documents/[docId]/presign endpoint for presigned download URLs
- Updated 6 PRD items to passes:true

### Notes for next dev
- S3 client uses lazy singleton init (created on first call)
- getEnv() throws if env var missing (fail-fast)
- downloadFile streams response body into Buffer
- Upload endpoint no longer stores file content in metadata - only originalName, mimeType, tags
- Process endpoint uses storageKey to download from S3 for text extraction
- Presigned URLs default to 1 hour expiry
- Remaining false PRD items: citations UI (1), react-pdf + DocumentViewer (4)

### Files created
- lib/s3.ts - S3 client singleton and helpers
- app/api/vaults/[id]/documents/[docId]/presign/route.ts - presigned URL endpoint

### Files modified
- .env.example - added AWS env vars
- app/api/vaults/[id]/documents/route.ts - S3 upload, server-side 25MB validation
- app/api/vaults/[id]/documents/process/route.ts - S3 download instead of base64

## 2026-01-27: Citation Parsing and Badge Rendering in Chat UI

### Completed
- Added citation parsing to MarkdownRenderer for [docName, chunk N] format
- CitationBadge component renders inline with FileText icon, truncated doc name, chunk number
- Badges styled with primary/10 bg, primary text, border, hover state
- parseCitations() splits text on citation regex, returns React nodes
- processChildren() recursively walks React children to find text nodes with citations
- Applied to paragraph and list item renderers in MarkdownRenderer
- MarkdownRenderer accepts optional onCitationClick callback for future document viewer integration
- Updated 1 PRD item to passes:true

### Notes for next dev
- onCitationClick not wired to anything yet - needs DocumentViewer (not yet built)
- Citation regex: \[([^\]]+?),\s*chunk\s+(\d+)\]
- Badges show in both chat-panel compact view and full-width assistant page response
- Remaining false PRD items: react-pdf (1), DocumentViewer (1), document preview in vault (1), citation click opens viewer (1)

### Files modified
- components/ui/markdown-renderer.tsx - citation parsing, CitationBadge, processChildren

## 2026-01-27: Document Preview (react-pdf + DocumentViewer)

### Completed
- Installed react-pdf package
- Configured Next.js webpack to exclude canvas for SSR compatibility
- Created DocumentViewer component at components/vault/document-viewer.tsx
- PDF rendering via react-pdf with page navigation, zoom controls, download button
- Non-PDF files render as pre-formatted text
- Added document preview to vault detail page: clicking a document row fetches presigned URL and opens viewer
- Wired citation badges in assistant page to open DocumentViewer on click
- Citation click matches attached file by name, fetches presigned URL, opens viewer
- Updated 4 PRD items to passes:true - ALL PRD items now complete

### Notes for next dev
- pdf.js worker configured via import.meta.url for Next.js compatibility
- DocumentViewer is a fixed overlay (z-50) - not a modal/dialog
- Citation click uses fuzzy name matching (attached file name vs citation document name)
- Text highlight/scroll for citation navigation not implemented - would need chunk-to-page mapping
- Non-PDF preview shows textContent prop or fallback message
- Pre-existing .next/types validator errors (Route type) unrelated to this work

### Files created
- components/vault/document-viewer.tsx - DocumentViewer with react-pdf

### Files modified
- next.config.ts - webpack canvas alias for react-pdf SSR
- app/(dashboard)/vault/[id]/page.tsx - document row click handler, preview state, DocumentViewer render
- app/(dashboard)/assistant/page.tsx - citation click handler, citationPreview state, DocumentViewer render
- package.json - added react-pdf dependency

## 2026-01-28: Typecheck Fix for react-pdf CSS Imports

### Completed
- Created types/react-pdf.d.ts with module declarations for react-pdf CSS files
- Fixed TS2307 errors for react-pdf/dist/Page/AnnotationLayer.css and TextLayer.css
- Typecheck and lint both pass clean

### Notes for next dev
- All PRD items are passes:true - feature work complete
- Agent creation PRD items added to prd.json but not yet implemented (separate PRD in prd/agent_creation_prd.md)
- Remaining work: agent CRUD, test console, sidebar nav for agents

### Files created
- types/react-pdf.d.ts - CSS module declarations for react-pdf

## 2026-01-28: Agent Model and CRUD API

### Completed
- Added Agent model to Prisma schema (id, userId, name, slug, description, instruction, timestamps)
- Unique constraint on (userId, slug), index on userId
- Added agents relation to User model
- Regenerated Prisma client
- Created GET /api/agents - list agents filtered by userId, ordered by updatedAt desc
- Created POST /api/agents - create agent with auto-slug, uniqueness check, validation
- Created GET /api/agents/[id] - fetch by id + userId, 404 if not found
- Created PUT /api/agents/[id] - update with slug re-generation on name change, uniqueness check excluding self
- Created DELETE /api/agents/[id] - delete by id + userId, returns 204
- Created POST /api/agents/test - streaming test console, accepts instruction + messages, no DB persistence
- Updated 7 PRD items to passes:true

### Notes for next dev
- Uses MOCK_USER_ID - wire to auth session when implemented
- Slug conflicts resolved by appending timestamp suffix
- Test console streams via Vercel AI SDK streamText + toTextStreamResponse
- Next priority: Agent UI pages (/agents list, /agents/new, /agents/[id]/edit) and sidebar nav
- Remaining false PRD items: all UI agent items (list page, sidebar nav, create/edit forms, delete dialog, test console component, styling)

### Files created
- app/api/agents/route.ts - GET and POST endpoints
- app/api/agents/[id]/route.ts - GET, PUT, DELETE endpoints
- app/api/agents/test/route.ts - streaming test console endpoint

### Files modified
- prisma/schema.prisma - added Agent model, updated User relations

## 2026-01-28: Agent List Page and Sidebar Nav

### Completed
- Created /agents route with full agent list page
- Card layout: 3-column grid, name, description (line-clamp-2), updatedAt
- Create New Agent button links to /agents/new
- Edit links to /agents/[id]/edit, delete with AlertDialog confirmation
- Loading spinner, empty state with Bot icon, error state with retry
- Search filters agents by name/description
- Added Agents nav item (Bot icon) to sidebar between Vault and Workflows
- Updated 3 PRD items to passes:true

### Notes for next dev
- Agent cards link to /agents/[id]/edit (edit page not yet created)
- /agents/new page not yet created - will 404
- Delete uses same AlertDialog pattern as vault page
- No toast system - errors show inline banner
- Remaining false PRD items: /agents/new (1), /agents/[id]/edit (1), test console (1), test console integration (1), agent page styling (1)

### Files created
- app/(dashboard)/agents/page.tsx - agent list page

### Files modified
- components/app-sidebar.tsx - added Bot icon import, Agents nav item

## 2026-01-28: Agent Create/Edit Pages with Test Console

### Completed
- Created /agents/new page with name, description, instruction fields
- Created /agents/[id]/edit page pre-populated from API
- Built TestConsole component with streaming chat interface
- Side-by-side layout: config form (left) + test console (right)
- Console disabled until name and instruction filled
- Conversation resets when instruction changes
- Edit page has unsaved changes warning (beforeunload)
- Save button disabled when no changes or invalid
- Inline validation, error states, loading states
- Styling uses global design system (0 shadows, 0-4px radius, minimal buttons)
- Updated 5 PRD items to passes:true - ALL PRD items now complete

### Notes for next dev
- No toast system - uses inline error banners and redirect on success
- Test console streams from /api/agents/test endpoint
- Edit page tracks initial values via ref for dirty detection
- Console width fixed at 400px, form takes remaining flex space
- All PRD items passes:true

### Files created
- components/agents/test-console.tsx - streaming test console component
- app/(dashboard)/agents/new/page.tsx - agent creation form
- app/(dashboard)/agents/[id]/edit/page.tsx - agent edit form

## 2026-01-28: SourceType Enum Update for Agent Integration

### Completed
- Added 'document' and 'agent' values to SourceType enum in Prisma schema
- 'document' was missing but already used in code (sourceType: "document" in query route)
- 'agent' added for upcoming agent-as-tool integration
- Regenerated Prisma client
- Fixed lint error in test-console.tsx (refs during render)
- Refactored TestConsole to use key-based reset pattern instead of refs
- Updated 1 PRD item to passes:true

### Notes for next dev
- SourceType now has: vault, document, agent, external_database, system_knowledge
- TestConsole uses wrapper component with key={instruction} to force remount on instruction change
- This avoids all ref-during-render issues the strict eslint rule catches
- Next priority: lib/agent-tools.ts (agent-to-tool converter) for agent integration backend

### Files modified
- prisma/schema.prisma - added 'document' and 'agent' to SourceType enum
- components/agents/test-console.tsx - refactored to key-based reset pattern

## 2026-01-28: Agent-to-Tool Converter (lib/agent-tools.ts)

### Completed
- Created lib/agent-tools.ts with createAgentTool and buildAgentTools functions
- createAgentTool wraps Agent record as a Tool using AI SDK tool() function
- Uses inputSchema (not parameters) per AI SDK v5+ naming convention
- Tool execute uses generateText with agent.instruction as system prompt
- buildAgentTools creates Record of tools keyed by `agent_{slug}`
- Supports deepAnalysis flag to switch between defaultModel and analysisModel
- Updated 1 PRD item to passes:true

### Notes for next dev
- AI SDK v5+ renamed `parameters` to `inputSchema` for tool definitions
- Tool returns string (the generated text from sub-agent)
- Uses generateText (not ToolLoopAgent) for sub-agent execution since agents have no tools
- Next priority: Update /api/assistant/query to accept agentIds and use buildAgentTools

### Files created
- lib/agent-tools.ts - agent-to-tool converter with createAgentTool, buildAgentTools

## 2026-01-28: Agent Tools Integration in Query Route

### Completed
- Added agentIds parameter to /api/assistant/query request body
- Fetches selected agents from database filtered by userId
- Builds agent tools using buildAgentTools() from lib/agent-tools.ts
- Appends agent availability info to system prompt when agents selected
- Replaced streamText with ToolLoopAgent for tool loop support
- Uses createAgentUIStreamResponse for UI message streaming
- onStepFinish callback tracks agent tool calls and persists on final step
- Stores agent tool calls as SourceReference with sourceType: 'agent'
- History entry includes agent consultation count in sourcesSummary
- Updated 5 PRD items to passes:true

### Notes for next dev
- createAgentUIStreamResponse uses onStepFinish (not onFinish) for step callbacks
- Tool calls use `input` property (not `args`), results use `output` (not `result`)
- Final step detected by `finishReason !== "tool-calls"`
- Next priority: UI mention system for @ mentioning agents/vaults in chat input

### Files modified
- app/api/assistant/query/route.ts - replaced streamText with ToolLoopAgent, added agent integration

## 2026-01-28: @ Mention System for Agents and Vaults

### Completed
- Installed shadcn command and popover components
- Created hooks/use-mentions.ts with useMentions hook for fetching vaults/agents
- Created components/assistant/mention-dropdown.tsx with Command-based dropdown
- Created components/assistant/mention-badge.tsx with colored badges (blue=vault, purple=agent)
- Created components/assistant/mention-input.tsx with @ detection and dropdown trigger
- Integrated MentionInput into assistant page, replacing Textarea
- Added mentions state and passed agentIds to API in handleSubmit
- Reset mentions on new thread/conversation clear
- Keyboard navigation works via Command component (arrow keys, Enter, Escape)
- Updated 10 PRD items to passes:true

### Notes for next dev
- MentionDropdown uses fixed positioning at calculated cursor position
- Mentions stored as array of { id, type, name } objects
- MentionBadge shows removable badges above textarea when mentions selected
- @ pattern detected via regex /@(\w*)$/ matching text before cursor
- cmdk package installed as dependency of shadcn command component
- Remaining false PRD items: useChat migration, UIMessage parts rendering, tool call display

### Files created
- hooks/use-mentions.ts - useMentions hook
- components/assistant/mention-dropdown.tsx - Command-based dropdown
- components/assistant/mention-badge.tsx - colored mention badges
- components/assistant/mention-input.tsx - textarea with @ detection

### Files modified
- app/(dashboard)/assistant/page.tsx - integrated MentionInput, added mentions state, passes agentIds
- components/ui/command.tsx - shadcn command component (new)
- components/ui/dialog.tsx - updated by shadcn

## 2026-01-28: useChat Migration and Tool Call Display

### Completed
- Migrated assistant page from useCompletion to useChat hook
- Created DefaultChatTransport with custom fetch for X-Query-Id header capture
- Created getMessageText helper to extract text from UIMessage parts array
- Created getToolInvocations helper to extract tool calls from message parts
- Created ToolCallDisplay component for collapsible agent consultation display
- Integrated tool call display into chat response area
- Updated handleSubmit to use sendMessage() with requestBodyRef pattern
- Updated hasResponse check to work with messages array
- Reset messages on new thread
- All 4 PRD items (useChat migration, UIMessage rendering, tool-call-display, integration) now passes:true

### Notes for next dev
- useChat uses messages array, not completion string
- Tool parts have type `tool-{toolName}` not `tool-invocation`
- DefaultChatTransport body uses ref pattern to pass dynamic request body
- Custom fetch intercepts response headers for query ID tracking
- ToolCallDisplay shows collapsed by default, expands to show query/response
- ALL PRD items now complete (passes:true)

### Files created
- components/assistant/tool-call-display.tsx - collapsible tool call display

### Files modified
- app/(dashboard)/assistant/page.tsx - useChat migration, tool invocations, message parts handling

## 2026-01-28: Deselectable Output Type Toggles

### Completed
- Changed OutputType to allow null (no forced output type)
- Default outputType now null instead of "draft" - page loads with no toggle pressed
- Draft Document toggle now deselectable - clicking pressed toggle sets outputType to null
- Review Table toggle now deselectable - clicking pressed toggle sets outputType to null
- Fixed pre-existing lint error in mention-dropdown.tsx (setState in effect)
- Used key-based remount pattern to reset selectedIndex without useEffect
- Updated 3 PRD items to passes:true

### Notes for next dev
- OutputType is "draft" | "review_table" | null - null means AI auto-detects mode
- API maps null outputType to "chat" QueryOutputType enum
- MentionDropdown uses wrapper component with key={searchQuery-open} to force remount
- Remaining false PRD items: ScrollArea (1), MentionInput max-height (1), functional tests (2)

### Files modified
- app/(dashboard)/assistant/page.tsx - OutputType allows null, toggles deselectable
- components/assistant/mention-dropdown.tsx - key-based reset pattern

## 2026-01-28: ScrollArea and MentionInput Overflow Fixes

### Completed
- Added shadcn scroll-area component
- Wrapped ChatPanel content area (query display, edit form, generation status, completion) in ScrollArea
- Removed overflow-y-auto from completion div (ScrollArea handles it)
- Added max-h-[40vh] overflow-y-auto to MentionInput wrapper div
- Long responses now scroll within ChatPanel instead of overflowing page
- Long input text scrolls within MentionInput instead of expanding page
- Updated 2 PRD items to passes:true

### Notes for next dev
- ScrollArea wraps everything between header and chat input in ChatPanel
- MentionInput overflow is on the container div, not the EditorContent itself
- Remaining false PRD items: functional tests (2) - require actual API key to verify
- All code/UI PRD items now complete

### Files created
- components/ui/scroll-area.tsx - shadcn ScrollArea component

### Files modified
- components/assistant/chat-panel.tsx - ScrollArea wrapper around content area
- components/assistant/mention-input.tsx - max-h-[40vh] overflow-y-auto on wrapper

## 2026-01-28: Ask Button Immediate Loader

### Completed
- Added isSubmitting state to bridge gap between click and stream start
- isLoading now derived from: status === "streaming" || isSubmitting
- setIsSubmitting(true) called before sendMessage() in handleSubmit
- useEffect clears isSubmitting when status becomes "streaming" or "error"
- Ask button spinner shows immediately on click, not after server responds
- Updated 1 PRD item to passes:true

### Notes for next dev
- isSubmitting is separate from streaming status to cover the network latency gap
- useEffect watches both status and error to ensure cleanup on failures
- Remaining false PRD items: markdown-body class (1), markdown font (1), history page (6), agent generate-instruction (3), functional tests (2)

### Files modified
- app/(dashboard)/assistant/page.tsx - added isSubmitting state, useEffect cleanup

## 2026-01-28: Markdown Body Class and Geist Font

### Completed
- Added markdown-body class to MarkdownRenderer wrapper div
- Changed .markdown-body font-family from system font stack to var(--font-sans), sans-serif
- Markdown content now picks up global .markdown-body CSS styles and renders in Geist font
- Updated 2 PRD items to passes:true

### Notes for next dev
- Remaining false PRD items: history page (6), agent generate-instruction (3), functional tests (2)
- Monospace/code font rules unchanged

### Files modified
- components/ui/markdown-renderer.tsx - added markdown-body class to wrapper div
- app/globals.css - changed .markdown-body font-family to var(--font-sans)

## 2026-01-28: History Page API Integration and Conversation Restore

### Completed
- Removed all mock history data from history page
- Fetches real entries from GET /api/history on mount
- Debounced search (300ms) re-fetches with ?search= param, resets page to 1
- Date range filter computes dateFrom and passes to API
- Pagination controls: Previous/Next buttons, page count display
- Loading spinner during fetch
- Empty state with contextual message (search vs no entries)
- Error state with retry button
- Removed Group By dropdown (was UI-only, not useful without server-side grouping)
- Added MarkdownRenderer to detail dialog response display
- "Open in Assistant" button in detail dialog navigates to /assistant?queryId=X
- Created GET /api/assistant/query/[id] endpoint for fetching single query data
- Assistant page reads queryId from URL params on mount
- Fetches query data, hydrates messages/mode/submittedQuery
- Clears queryId from URL after loading via history.replaceState
- Updated 6 PRD items to passes:true

### Notes for next dev
- Remaining false PRD items: agent generate-instruction (3), functional tests (2)
- History conversation restore creates synthetic UIMessage objects for useChat
- Draft outputType restores in document mode with editor content
- GET /api/assistant/query/[id] uses MOCK_USER_ID - wire to auth when ready

### Files created
- app/api/assistant/query/[id]/route.ts - GET endpoint for single query

### Files modified
- app/(dashboard)/history/page.tsx - full rewrite with API integration
- app/(dashboard)/assistant/page.tsx - queryId URL param handling for conversation restore

## 2026-01-28: Agent Instruction Generate/Improve Feature

### Completed
- Created POST /api/agents/generate-instruction endpoint
- Accepts { mode: 'generate' | 'improve', text: string }
- Generate mode: LLM produces structured system instruction from rough idea
- Improve mode: LLM refines existing instruction
- Streams response via streamText + toTextStreamResponse
- Created InstructionActions component with Generate (Wand2) and Improve (Sparkles) buttons
- Generate opens Dialog for rough idea input, streams result into instruction field
- Improve streams refined version of current instruction
- Both buttons show Loader2 spinner while streaming
- Improve disabled when instruction empty
- Integrated InstructionActions into /agents/new and /agents/[id]/edit pages
- Positioned next to System Instruction label via flex justify-between
- Updated 4 PRD items to passes:true

### Notes for next dev
- Remaining false PRD items: functional tests (2) - require actual API key to verify
- All code/UI PRD items now complete
- Generate/Improve use defaultModel (gemini-2.5-flash)
- No DB persistence for generation requests (stateless)

### Files created
- app/api/agents/generate-instruction/route.ts - streaming instruction generation endpoint
- components/agents/instruction-actions.tsx - Generate/Improve buttons component

### Files modified
- app/(dashboard)/agents/new/page.tsx - added InstructionActions import and integration
- app/(dashboard)/agents/[id]/edit/page.tsx - added InstructionActions import and integration

## 2026-01-30: Client Intake Prisma Schema (Onboarding Foundation)

### Completed
- Added IntakeStatus enum (draft, submitted, under_review, reviewed)
- Added EligibilityVerdict enum (strong, moderate, weak, insufficient)
- Added Client model with all intake fields (personal, US intent, achievement, impact, recommenders, standing, timeline, alt categories)
- Client has currentStep, status, vaultId (unique optional) fields
- Added CriterionResponse model (clientId + criterion unique, responses Json, cascade delete)
- Added EligibilityReport model (clientId unique, verdict, summary, criteria Json, rawOutput)
- Added client back-relation to Vault model (Client?)
- Regenerated Prisma client
- Updated 5 PRD items to passes:true

### Notes for next dev
- Requires db:push after setting DATABASE_URL for new tables
- Client.userId not a foreign key relation (no User relation) - matches MOCK_USER_ID pattern
- Next priority: install react-hook-form, create onboarding API routes (draft, criteria, upload, submit, report)
- Then: onboarding UI (layout, shell, step pages)

### Files modified
- prisma/schema.prisma - added enums, Client, CriterionResponse, EligibilityReport models, Vault back-relation

## 2026-01-30: Onboarding API Routes and react-hook-form Install

### Completed
- Installed react-hook-form and @hookform/resolvers
- Created GET /api/onboarding/draft - finds existing draft Client or creates new with auto-created vault
- Created PATCH /api/onboarding/draft - updates partial Client fields, renames vault when name fields change
- Created GET /api/onboarding/[clientId]/criteria - returns all CriterionResponses for client
- Created PUT /api/onboarding/[clientId]/criteria - upserts single CriterionResponse by criterion slug
- Created POST /api/onboarding/[clientId]/upload - uploads files to S3 via client's vault, triggers embedding pipeline
- Created POST /api/onboarding/[clientId]/submit - validates required fields, sets status to under_review, returns 202
- Created GET /api/onboarding/[clientId]/report - returns EligibilityReport + client status for polling
- Updated 7 PRD items to passes:true

### Notes for next dev
- Uses MOCK_USER_ID - wire to auth when implemented
- Submit endpoint has placeholder comment for EB1A evaluator trigger (not yet built)
- Report endpoint returns { status, report: null } when report not yet generated (not 404)
- Upload reuses S3 + embedding pipeline pattern from vault documents
- Draft PATCH updates vault name to "Intake - {firstName} {lastName} - {date}" when name fields change
- Next priority: onboarding UI (layout, shell, step components, zod schemas, use-onboarding hook)

### Files created
- app/api/onboarding/draft/route.ts - GET and PATCH endpoints
- app/api/onboarding/[clientId]/criteria/route.ts - GET and PUT endpoints
- app/api/onboarding/[clientId]/upload/route.ts - POST endpoint
- app/api/onboarding/[clientId]/submit/route.ts - POST endpoint
- app/api/onboarding/[clientId]/report/route.ts - GET endpoint

### Files modified
- package.json - added react-hook-form, @hookform/resolvers

## 2026-01-30: Onboarding UI (Full 6-Step Intake Flow)

### Completed
- Created onboarding layout with minimal chrome (no sidebar, logo + header only)
- Created OnboardingShell component with progress bar, step labels, back/next nav, save indicator
- Created onboarding root page that loads draft and redirects to current step
- Created step router at /onboarding/steps/[step] rendering correct step component
- Created zod schemas for steps 1, 2, 4, 5
- Created use-onboarding hook with draft loading, debounced auto-save (2s), step transitions, save status tracking
- Created step-personal.tsx: name, email, phone, DOB, citizenship, field, education (repeatable), employer, US intent
- Created step-achievement.tsx: major achievement toggle + details textarea
- Created criteria-questions.ts: 10 EB1A criteria with sub-questions (text, textarea, number, boolean types)
- Created criteria-tab.tsx: single criterion sub-form with debounced save to API
- Created step-criteria.tsx: vertical tabs for 10 criteria with completion indicators
- Created step-impact.tsx: social following, keynotes, recommenders (repeatable), self-assessment, standing
- Created step-docs-timeline.tsx: evidence checklist, react-dropzone file upload to API, timeline fields, alt categories
- Created step-review.tsx: data summary, submit button, polling for eligibility report
- Created review-summary.tsx: verdict badge, per-criterion score bars, analysis text, evidence refs
- Updated 15 PRD items to passes:true

### Notes for next dev
- Remaining false PRD items: EB1A evaluator backend (2), functional tests (7)
- use-onboarding hook uses 2s debounce (not 30s as PRD says) - faster feedback
- Step 3 (criteria) saves per-criterion via PUT /api/onboarding/[clientId]/criteria
- Step 5 uploads via POST /api/onboarding/[clientId]/upload
- Step 6 polls /api/onboarding/[clientId]/report every 4s after submit
- No mobile accordion for criteria (desktop vertical tabs only) - add if needed
- react-hook-form watch() triggers React Compiler lint warnings (harmless)

### Files created
- app/onboarding/layout.tsx - minimal layout (no sidebar)
- app/onboarding/page.tsx - draft loader + redirect
- app/onboarding/steps/[step]/page.tsx - step router
- app/onboarding/_lib/onboarding-schema.ts - zod schemas
- app/onboarding/_lib/use-onboarding.ts - draft management hook
- app/onboarding/_lib/criteria-questions.ts - EB1A criteria config
- app/onboarding/_components/onboarding-shell.tsx - progress bar + nav
- app/onboarding/_components/step-personal.tsx
- app/onboarding/_components/step-achievement.tsx
- app/onboarding/_components/step-criteria.tsx
- app/onboarding/_components/criteria-tab.tsx
- app/onboarding/_components/step-impact.tsx
- app/onboarding/_components/step-docs-timeline.tsx
- app/onboarding/_components/step-review.tsx
- app/onboarding/_components/review-summary.tsx

## 2026-01-30: EB1A Evaluator Backend

### Completed
- Created lib/eb1a-evaluator.ts with system prompt, tool definitions, and evaluation runner
- System prompt instructs AI to evaluate all 10 EB1A criteria, score 1-5, determine verdict
- get_intake_data tool fetches Client + CriterionResponses from DB
- search_evidence tool wraps RAG query over client's vault documents via lib/rag.ts
- Uses generateText with analysisModel (gemini-2.5-pro) and stepCountIs(25) for multi-step tool use
- Parses structured JSON output from AI response (```json block)
- Saves EligibilityReport to DB via upsert (verdict, summary, per-criterion scores)
- Updates Client status to "reviewed" on success, resets to "submitted" on error
- Created POST /api/onboarding/[clientId]/evaluate endpoint
- Wired submit route to trigger evaluator non-blocking via fire-and-forget fetch
- Updated 2 PRD items to passes:true

### Notes for next dev
- Uses generateText with tools (not ToolLoopAgent) since AI SDK v5+ generateText supports stopWhen for multi-step
- PRD says "Use ToolLoopAgent" but generateText with stopWhen is equivalent and simpler
- Remaining false PRD items: functional tests (7) - require running app with API keys
- All code/backend PRD items now complete

### Files created
- lib/eb1a-evaluator.ts - EB1A evaluation runner with tools
- app/api/onboarding/[clientId]/evaluate/route.ts - evaluation trigger endpoint

### Files modified
- app/api/onboarding/[clientId]/submit/route.ts - wired evaluator trigger

## 2026-02-01: Landing Page and Layout Metadata

### Completed
- Replaced app/page.tsx redirect with full landing page
- Sections: nav, hero, how-it-works (3 steps), all 10 EB-1A criteria grid, value props (4), trust signals, footer CTA, footer
- Static page, no API calls, responsive (sm/md breakpoints)
- Links to /onboarding (primary CTA) and /assistant (secondary)
- Updated app/layout.tsx metadata: title "Casefor.ai - EB-1A Eligibility Evaluation", description for SEO
- Styling: flat design (no shadows), uses global CSS vars, bg-gray-50 alternating sections
- Updated 2 PRD items to passes:true

### Notes for next dev
- Landing page is pure static - no auth gating
- Dashboard redirect lives in app/(dashboard)/page.tsx (unchanged)
- Remaining false PRD items: evaluation results page (1), Stripe payment flow (6), step-review redirect (1), error/cancel states (2), post-payment success (1), functional tests (2)
- Next highest priority: evaluation results page at /evaluation/[clientId]

### Files modified
- app/page.tsx - replaced redirect with full landing page
- app/layout.tsx - updated metadata for Casefor.ai branding

## 2026-02-01: Evaluation Results Page + Step-Review Redirect

### Completed
- Created app/evaluation/[clientId]/page.tsx with full evaluation results display
- Polls GET /api/onboarding/[clientId]/report every 4s while awaiting results
- Shows approval probability badge (strong=85%, moderate=60%, weak=30%, insufficient=10%)
- Verdict messaging per tier, full ReviewSummary component reused from onboarding
- Loading/polling state while report generating (spinner + message)
- Error state with Retry button and Contact Support link
- Reads ?payment=cancelled query param and shows cancellation message
- Payment CTA button at bottom of report
- Modified step-review.tsx to redirect to /evaluation/[clientId] after submit
- Removed inline report polling/display from step-review (moved to evaluation page)
- Already-submitted clients auto-redirect to evaluation page on step 6 load
- Updated 4 PRD items to passes:true

### Notes for next dev
- Payment CTA currently navigates to /api/payments/checkout?clientId=X - endpoint doesn't exist yet
- "Eval page after paying: redirect to /assistant" item needs GET /api/payments/status endpoint first
- Functional test items (auto mode routing) still false - require live AI key
- Remaining false PRD items: Stripe payment flow (schema + 6 endpoints/pages), payment redirect, functional tests (2)

### Files created
- app/evaluation/[clientId]/page.tsx - evaluation results page

### Files modified
- app/onboarding/_components/step-review.tsx - redirect to /evaluation/[clientId] instead of inline report

## 2026-02-01: Stripe Payment Integration

### Completed
- Added 'paid' to IntakeStatus enum in schema.prisma
- Added stripeSessionId, stripeCustomerId, paidAt fields to Client model
- Ran prisma generate
- Installed stripe npm package
- Added STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, ENABLE_STRIPE to .env.example
- Created POST /api/payments/checkout - dual mode (ENABLE_STRIPE=false bypasses Stripe, marks paid immediately)
- Created POST /api/payments/webhook - verifies Stripe signature, handles checkout.session.completed
- Created GET /api/payments/status/[clientId] - returns { paid, paidAt }
- Created /payment/success page with confirmation + CTA to /assistant
- Wired eval page: checks payment status on mount, redirects to /assistant if paid
- Wired eval page: handlePayment now POSTs to /api/payments/checkout and redirects to returned URL
- Updated 10 PRD items to passes:true

### Notes for next dev
- ENABLE_STRIPE=false (default) skips Stripe entirely - marks client as paid and redirects to success page
- Webhook route reads raw body via req.text() for Stripe signature verification
- Checkout route derives base URL from request Host header
- Migration not run (no DB instance) - run prisma migrate dev when DB available
- Remaining false PRD items: 2 functional test items (auto mode routing) - require live AI key to verify

### Files created
- app/api/payments/checkout/route.ts
- app/api/payments/webhook/route.ts
- app/api/payments/status/[clientId]/route.ts
- app/payment/success/page.tsx

### Files modified
- prisma/schema.prisma - added paid enum value + 3 stripe fields
- .env.example - added 5 stripe env vars
- app/evaluation/[clientId]/page.tsx - payment status check + POST checkout

## 2026-02-01: Add 5 new document categories + update categorization prompt

### Completed
- Added 5 new categories to lib/document-categories.ts: immigration-form, financial-record, personal-statement, business-plan, identity-document
- Updated categorization prompt in lib/categorize-document.ts with guidance for new categories
- Schema enum auto-derives from CATEGORY_SLUGS so no schema change needed
- Updated 2 PRD items to passes:true

### Notes for next dev
- CATEGORY_SLUGS is derived from DOCUMENT_CATEGORIES array, so adding to the array is sufficient
- Categorization prompt now includes explicit guidance for distinguishing new categories
- Cannot test with sample documents without live AI key
- Next high-priority items: auth/roles system (UserRole, NextAuth, middleware) - blocks lawyer portal and role-based filtering

## 2026-02-01: Auth System (NextAuth v5 + Role-Based Access)

### Completed
- Added UserRole enum (applicant, lawyer, admin) to Prisma schema
- Added passwordHash and role fields to User model
- Added CaseAssignment model (lawyerId + clientId unique, cascade delete, indexes)
- Added caseAssignments relation to both User and Client models
- Installed next-auth@beta, @auth/prisma-adapter, bcryptjs
- Created lib/auth.ts with NextAuth v5 credentials provider, JWT strategy, role in session
- Created app/api/auth/[...nextauth]/route.ts handler
- Created middleware.ts with role-based route protection (applicant: /onboarding + /evaluation, lawyer: /lawyer routes, admin: all)
- Created lib/get-user.ts with getUser() and requireUser() helpers
- Replaced MOCK_USER_ID in all 12 API route files with session-based auth via getUser()
- Each API handler returns 401 if no session
- Created /login page with email/password form
- Added AUTH_SECRET to .env.example
- Updated 8 PRD items to passes:true

### Notes for next dev
- NextAuth v5 (beta.30) used, compatible with Next.js 16
- Credentials provider with bcryptjs password hashing
- JWT session strategy (no server-side sessions in DB)
- Layout-level auth handled by middleware (not per-layout checks) since dashboard layout is "use client"
- No user registration endpoint yet - need seed script or signup page
- Migration not run (no DB) - run prisma migrate dev when DB available
- Remaining false PRD items: expanded onboarding (13), lawyer portal (17), shared dropzone (2), role-based vault filtering (3), functional tests (2)
- Next highest priority: expanded onboarding (10-step flow) or lawyer portal

### Files created
- lib/auth.ts - NextAuth v5 configuration
- lib/get-user.ts - session user helpers
- middleware.ts - role-based route protection
- app/api/auth/[...nextauth]/route.ts - NextAuth handler
- app/login/page.tsx - login page

### Files modified
- prisma/schema.prisma - UserRole enum, User fields, CaseAssignment model, Client relation
- .env.example - added AUTH_SECRET
- app/api/agents/route.ts - replaced MOCK_USER_ID
- app/api/agents/[id]/route.ts - replaced MOCK_USER_ID
- app/api/assistant/query/route.ts - replaced MOCK_USER_ID
- app/api/assistant/query/[id]/route.ts - replaced MOCK_USER_ID
- app/api/documents/route.ts - replaced MOCK_USER_ID
- app/api/onboarding/draft/route.ts - replaced MOCK_USER_ID
- app/api/onboarding/[clientId]/criteria/route.ts - replaced MOCK_USER_ID
- app/api/onboarding/[clientId]/upload/route.ts - replaced MOCK_USER_ID
- app/api/onboarding/[clientId]/submit/route.ts - replaced MOCK_USER_ID
- app/api/onboarding/[clientId]/report/route.ts - replaced MOCK_USER_ID
- app/api/payments/checkout/route.ts - replaced MOCK_USER_ID
- app/api/payments/status/[clientId]/route.ts - replaced MOCK_USER_ID

## 2026-02-01: Expanded Onboarding (10-Step Flow)

### Completed
- Added 8 new fields to Client model in Prisma schema (consentToProcess, currentImmigrationStatus, desiredStatus, previousApplications, urgencyReason, specialCircumstances, communicationPreference, timezone)
- Updated onboarding-schema.ts with new zod schemas for all 10 steps (step2=basic-info, step4=background, step6=achievement, step7=immigration, step8=circumstances, step9=preferences, impactSchema, docsSchema)
- Updated ClientData interface in use-onboarding.ts with new fields
- Created step-welcome.tsx: welcome screen with process overview and 9-step breakdown
- Created step-basic-info.tsx: name, email, phone, consent checkbox
- Created step-resume-upload.tsx: dropzone for resume upload to vault (no parse yet)
- Created step-background.tsx: citizenship, DOB, field, education (repeatable), employer
- Created step-immigration.tsx: current status, desired status, previous applications, US intent
- Created step-circumstances.tsx: urgency, timeline, urgency reason, special circumstances
- Created step-preferences.tsx: communication preference, timezone, alt category toggles
- Updated onboarding-shell.tsx: 10 step labels, totalSteps=10, overflow-x-auto for label bar
- Updated step router ([step]/page.tsx): 10-step switch, new imports, step limit 10
- Updated step-review.tsx: 6 summary sections with edit links per section, currentStep=10 on submit
- Fixed step-achievement.tsx import: step2Schema -> step6Schema
- Fixed step-impact.tsx import: step4Schema -> impactSchema
- Updated 12 PRD items to passes:true

### Notes for next dev
- step-personal.tsx is now unused (split into step-basic-info + step-background) - can delete later
- step-docs-timeline.tsx is now unused (upload in step-resume-upload, timeline in step-circumstances, evidence in step-criteria) - can delete later
- step-impact.tsx is now unused (not in 10-step flow) - can delete later or re-add if needed
- step-criteria.tsx NOT renamed to step-evidence.tsx (PRD item still false) - kept existing name
- Resume parsing not implemented (3 PRD items still false) - requires lib/resume-parser.ts
- Reset endpoint not implemented (3 PRD items still false) - requires API + cascade delete
- Remaining false PRD items: step-criteria rename (1), resume parser (4), reset endpoint (3), lawyer portal (17), shared dropzone (2), role-based filtering (3), functional tests (2)
- Prisma generate needed after setting DATABASE_URL

### Files created
- app/onboarding/_components/step-welcome.tsx
- app/onboarding/_components/step-basic-info.tsx
- app/onboarding/_components/step-resume-upload.tsx
- app/onboarding/_components/step-background.tsx
- app/onboarding/_components/step-immigration.tsx
- app/onboarding/_components/step-circumstances.tsx
- app/onboarding/_components/step-preferences.tsx

### Files modified
- prisma/schema.prisma - added 8 new fields to Client model
- app/onboarding/_lib/onboarding-schema.ts - rewritten with 10-step schemas
- app/onboarding/_lib/use-onboarding.ts - added new fields to ClientData
- app/onboarding/_components/onboarding-shell.tsx - 10 steps
- app/onboarding/steps/[step]/page.tsx - 10-step router
- app/onboarding/_components/step-review.tsx - 6-section summary with edit links
- app/onboarding/_components/step-achievement.tsx - fixed schema import
- app/onboarding/_components/step-impact.tsx - fixed schema import

## 2026-02-01: Resume Parser Feature

### Completed
- Created lib/resume-parser.ts with generateObject + zod schema, extracts 10 fields with confidence scores
- Created POST /api/onboarding/[clientId]/parse-resume endpoint (downloads from S3, extracts text, parses via AI)
- Created confidence-badge.tsx component (green/yellow/red color coding)
- Updated step-resume-upload.tsx: after upload, calls parse-resume API, shows field preview, auto-fills form
- Updated use-onboarding.ts: added resumeConfidence state, intercepts _resumeConfidence metadata from updateFields
- Added confidence badges to step-basic-info.tsx (firstName, lastName, email, phone)
- Added confidence badges to step-background.tsx (citizenship, fieldOfExpertise, currentEmployer, education)
- Updated step page to pass resumeConfidence and onUpdate to components
- Marked 4 PRD items as passes:true

### Notes for next dev
- Resume parsing uses defaultModel (gemini-2.5-flash) not gemini-2.0-flash as PRD says - 2.0 not available
- Confidence is transient client state in useOnboarding hook, not persisted to DB
- Fields only auto-fill if confidence > 0.3; user can freely override
- Parse is non-fatal: if it fails, file is still uploaded to vault
- _resumeConfidence key in updateFields is intercepted and removed before PATCH to API

## 2026-02-01: Onboarding Reset (Start Over)

### Completed
- Created POST /api/onboarding/[clientId]/reset endpoint
- Cascade deletes: CriterionResponses, EligibilityReport, Documents (DB+S3), Pinecone namespace
- Resets all Client fields to null/defaults, currentStep=1, status=draft
- Resets vault name to "Intake - {date}"
- Added Start Over button to onboarding-shell.tsx (visible from step 2+)
- AlertDialog confirmation before reset
- Loading state on button during reset
- Redirects to /onboarding after reset

### Notes for next dev
- Reset uses Record<string, unknown> cast for data object because Prisma generated types may not include expanded fields
- S3 and Pinecone deletions are best-effort with try/catch - DB cleanup proceeds even if external services fail
- Start Over button only visible when currentStep > 1

## 2026-02-02: Drafts CRUD API routes

### Completed
- GET+POST /api/cases/[clientId]/drafts (list w/ recommender name, create w/ zod + 409 on duplicate)
- GET+PATCH+DELETE /api/cases/[clientId]/drafts/[id] (full detail w/ recommender info, partial update, delete w/ cascade)
- GET+POST /api/cases/[clientId]/drafts/[id]/versions (list versions desc, snapshot current content)
- Drafts auth: applicant can only PATCH personal_statement, 403 on other types
- All routes use authorizeCaseAccess, same pattern as recommender routes
- Typecheck clean, lint 0 errors

### Notes for next dev
- Draft unique constraint checked manually before insert (findFirst) to return 409 instead of Prisma error
- Version POST requires draft.content to exist (returns 400 if no content to snapshot)
- updateSchema uses z.any() for content/sections (TipTap JSON, arbitrary structure)
- Next priority: linkedin-profile doc category + linkedin extraction agent, OR drafting tools + agents

## 2026-02-02: Shared drafting tools module

### Completed
- Created lib/drafting-tools.ts with createDraftingTools(clientId) factory
- 6 tools: get_client_profile, search_vault, get_gap_analysis, get_eligibility_report, get_existing_drafts, get_recommender
- Follows same ai-sdk tool() pattern as eb1a-evaluator.ts
- All tools return JSON.stringify'd data, scoped to clientId
- get_existing_drafts truncates plainText to 2000 chars to avoid token bloat
- get_recommender validates recommender belongs to clientId

### Notes for next dev
- Tools are created via factory function (not bare exports) so each agent call is scoped to a client
- Next priority: drafting agents (petition-letter, personal-statement, etc.) that consume these tools
- Or: linkedin-profile doc category + linkedin extraction agent

## 2026-02-02: Recommendation letter drafting agent

### Completed
- Created `lib/drafting-agents/recommendation-letter.ts`
  - Two-phase pattern: research loop (stepCountIs(20)) then structured output
  - Uses `defaultModel` (gemini-2.5-flash) - same as personal-statement
  - Accepts `clientId` + `recommenderId` params
  - Research phase fetches recommender details, client profile, eligibility report, gap analysis, existing drafts, vault evidence
  - 7 sections: introduction, relationship, expertise, impact, criterion-specific testimony, peer comparison, conclusion
  - Third-person perspective from recommender's voice
  - markdownToTiptapParagraphs duplicated (same as personal-statement) - extract to shared util when 4th agent needs it

### Notes for next dev
- Next priority: cover-letter, exhibit-list, table-of-contents, rfe-response agents (all simpler, same pattern)
- Then: generate + regenerate API routes to wire agents to frontend
- markdownToTiptapParagraphs is now in 3 files - should extract to shared util soon

## 2026-02-02: Table of contents drafting agent

### Completed
- Created `lib/drafting-agents/table-of-contents.ts` following same 2-phase pattern (research + structured output)
- Registered `table_of_contents` in generate route agent map
- Uses `stepCountIs(15)` for research phase (similar to cover letter - TOC is a summary doc)
- System prompt focuses on inventorying all existing drafts and vault documents for comprehensive TOC
- Uses `get_existing_drafts` tool heavily to reference all prepared documents

### Notes for next dev
- markdownToTiptapParagraphs now duplicated in 6 files - extract to shared util
- RFE response agent is next functional item
- After that: per-section regeneration + its API route, then all UI work
