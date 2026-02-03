# PRD: E2E Demo Flow -- Applicant Onboarding through Lawyer Case Management

## Overview

Enable a complete demo flow for the founding team: an applicant completes the 10-step EB-1A onboarding, submits their case, then a lawyer logs in, sees all submitted cases, opens a case, runs gap analysis, uploads/ingests documents, manages recommenders, and drafts all 7 document types (petition letter, personal statement, recommendation letters, cover letter, exhibit list, table of contents, RFE response). Gap analysis auto-refreshes whenever vault content changes, continuously reducing gaps as evidence is ingested.

Currently blocked by: auth requiring CaseAssignment for lawyers, missing lawyer dashboard/case-list pages, no seed data, CaseSidebar on wrong side.

## Goals

- Full E2E demo: applicant onboarding -> lawyer dashboard -> case detail -> gap analysis -> doc ingestion -> all 7 draft types
- Lawyer sees ALL submitted cases (no assignment gating)
- Seed script for instant demo setup
- All 7 document generation agents working E2E
- Gap analysis auto-refreshes on vault changes; gap score always visible on case cards/headers

## Non-Goals

- Lawyer-to-case assignment workflow (deferred)
- Multi-lawyer collaboration
- Payment/billing flow
- Email notifications to recommenders
- Applicant-side post-submission features

## User Stories

**Applicant:**
1. Registers, completes 10-step onboarding
2. Submits case -> triggers AI eligibility evaluation
3. Sees evaluation results

**Lawyer:**
1. Logs in -> dashboard with stats + recent cases, each showing gap analysis indicator
2. /cases -> all submitted cases with search/filter, gap scores visible
3. Clicks case -> case detail with two-sidebar layout (primary nav collapsed to icons on left, case sub-nav as second left sidebar)
4. Views gap analysis -> sees per-criterion breakdown
5. Uploads documents -> embedding completes -> gap analysis auto-refreshes -> scores improve
6. Manages recommenders (add, AI suggest, status tracking)
7. Creates and generates all 7 draft types
8. Uses case-scoped AI assistant

## Functional Requirements

### F1: Remove CaseAssignment gate for lawyers

**Files:**
- `lib/case-auth.ts` (lines 37-49): remove assignment lookup
- `app/api/lawyer/cases/[clientId]/route.ts`: remove its own inline assignment check

Lawyers/admins access any non-draft case. Applicants still restricted to own cases.

### F2: Lawyer dashboard page

**Create:** page in appropriate route group (resolve route conflict with `(dashboard)/page.tsx` and root `page.tsx`)

- Stats: fetch `/api/lawyer/dashboard/stats`, show 4 cards (active, pending review, drafts in progress, unassigned)
- Recent cases grid using `CaseCard`, each card showing gap analysis overall strength indicator
- "View All Cases" link to `/cases`
- Role guard: redirect non-lawyers to `/assistant`

### F3: Lawyer case list page

**Create:** `app/(cases)/cases/page.tsx`

- Tabs: All / My Cases / Unassigned
- Search (debounced)
- Paginated `CaseCard` grid, each card showing gap score indicator
- API: `/api/lawyer/cases?tab=X&search=Y&page=Z`

### F4: Two-sidebar layout for case detail

**Current:** LawyerSidebar (left) + CaseSidebar (right)
**Target:** LawyerSidebar collapsed to icons (left) + CaseSidebar full-width (left, second sidebar)

Changes:
- `components/case-sidebar.tsx`: change `side="right"` to `side="left"`
- `app/(cases)/cases/[clientId]/layout.tsx`: restructure so both sidebars render left; LawyerSidebar defaults to collapsed/icon mode when CaseSidebar is present
- Case detail stays as single page with tabs, synced to URL (not separate subroute pages)

CaseSidebar nav items: Overview, Documents, Recommenders, Gap Analysis, Timeline, Assistant, Drafts (collapsible: All Drafts, Petition Letter, Personal Statement, Rec Letters, Cover Letter, Exhibit List, TOC, RFE Response)

### F5: Gap analysis auto-refresh + persistent indicator

**Auto-refresh trigger:** After document processing completes (embedding status -> completed), automatically POST to `/api/lawyer/cases/[clientId]/gap-analysis/refresh`

**Where to trigger:** In the document processing pipeline (`/api/vaults/[id]/documents/process` or equivalent), after successful embedding, fire gap analysis refresh for the associated client.

**Persistent indicator:** Surface `overallStrength` from latest GapAnalysis on:
- CaseCard component (case list + dashboard)
- Case detail page header (always visible regardless of active tab)
- Format: strength badge (1-5 or strong/moderate/weak/insufficient)

**API change:** `/api/lawyer/cases` response should include latest gap analysis overallStrength per case (may need to join GapAnalysis in query).

### F6: Seed script with demo data

**Modify:** `prisma/seed.ts`

- Lawyer user: `lawyer@demo.com`, per-user password, role=lawyer, bcrypt hashed
- Applicant user: `applicant@demo.com`, per-user password, role=applicant, bcrypt hashed
- Vault (knowledge_base type)
- Client: ML researcher profile, status=submitted, currentStep=10
- CriterionResponse: all 10 EB-1A criteria with realistic responses
- EligibilityReport: verdict=moderate
- 2-3 Recommenders at various statuses
- Document passwords in seed output / console log

### F7: Verify all 7 draft generation agents

Agents in `lib/drafting-agents/`: petition_letter, personal_statement, recommendation_letter, cover_letter, exhibit_list, table_of_contents, rfe_response

Flow: create draft -> generate -> poll until status=draft

### F8: Fix LawyerSidebar active state

`components/lawyer-sidebar.tsx` line 52: Dashboard (`/`) always shows active because every path starts with `/`. Special-case `/` to exact match only.

## Technical Considerations

### Route structure
- `app/page.tsx` = public landing
- `app/(dashboard)/page.tsx` = applicant dashboard (may claim `/`)
- Need to investigate how these coexist and where lawyer dashboard fits
- Options: conditional in `(dashboard)/page.tsx`, or dedicated `/lawyer` route

### Two-sidebar implementation
shadcn/ui SidebarProvider supports multiple sidebars. Key concerns:
- Both sidebars `side="left"` -- need to verify shadcn supports this
- LawyerSidebar should auto-collapse to icon mode inside case routes
- On non-case routes (dashboard, case list), only LawyerSidebar shows (full width)

### Gap analysis auto-refresh
- Document processing is async (fire-and-forget)
- After embeddings complete, need to identify which client owns the vault, then trigger refresh
- Gap analysis itself is also async -- frontend polls for completion
- Race condition: multiple docs processing simultaneously could trigger multiple refreshes. Use debounce or "latest wins" approach.

### Case detail tab sync
- Single page with tabs at `app/(cases)/cases/[clientId]/page.tsx`
- CaseSidebar links should update active tab, not navigate to separate pages
- Use URL search params (e.g., `?tab=gap-analysis`) or hash
- CaseSidebar highlights active item based on current tab

## Edge Cases

- Zero cases: dashboard empty state
- No vault on case: gap analysis/vault features disabled
- Draft generation failure: reverts to not_started for retry
- Concurrent gap analysis refreshes: last-write-wins
- Document processing failure: don't trigger gap refresh
- Gap analysis indicator missing (no analysis run yet): show "Not analyzed" state

## Implementation Order

1. F1: Auth fix (unblocks everything)
2. F6: Seed script (enables testing)
3. F8: Sidebar active state fix
4. F4: Two-sidebar layout
5. F3: Case list page
6. F2: Dashboard page
7. F5: Gap analysis auto-refresh + indicator
8. F7: Verify all draft agents
