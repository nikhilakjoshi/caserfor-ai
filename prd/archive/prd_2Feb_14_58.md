# PRD: Lawyer Dashboard, Unified Routing & Case Sidebar

**Depends on:** Existing lawyer routes, AppSidebar, LawyerSidebar, case detail tabs, auth system, AI SDK agent patterns.

**Previous PRDs (A-C):** Archived at `prd/archive/prd_2Feb_sections_AC.md`

---

## Overview

Redesign lawyer experience: new dashboard with AI assistant chatbox + stats + case table, unified ID-based routing for both roles, secondary case sidebar replacing tabs, dev-only role toggle.

## Goals

- Lawyer dashboard matches reference layout: greeting, assistant chatbox, stats cards, case table
- Dashboard assistant agent answers questions about all cases using full toolkit (case data + RAG)
- All case routes use `/cases/[clientId]` for both roles -- remove `/my-case`
- Lawyer case detail uses secondary sidebar (alongside collapsed primary) instead of tabs
- Dev-only role toggle for testing both views

## Non-goals

- Production role switching UI (auth-based only)
- New data models or schema changes
- Timeline feature implementation (placeholder page only)
- "Create case" or "Upload files" flows (buttons present, stubbed)

---

## User Stories

**Lawyer:**
- See dashboard with greeting, stats overview, and case table
- Ask assistant questions about case statuses, deadlines, draft progress across all cases
- Navigate inside a case via secondary sidebar (documents, recommenders, drafts, gap analysis, etc.)
- Quick-action buttons on dashboard for common queries

**Applicant:**
- Access case at `/cases/[clientId]` instead of `/my-case`
- Sidebar "My Case" link resolves to correct ID-based route

---

## D1. Role Context + Dev Toggle

**RoleProvider** (`components/role-provider.tsx`):
- React context: `{ role, setRole, clientId }`
- Reads from session via NextAuth. In dev (`NODE_ENV === 'development'`), reads override from `localStorage` key `dev-role-override`
- Wrap root `app/layout.tsx` with `<RoleProvider>`

**Dev Toggle** (`components/dev-role-toggle.tsx`):
- Pill/switch in header, only rendered when `NODE_ENV === 'development'`
- Toggles between lawyer/applicant, persists to localStorage

---

## D2. Unified Routing

Current state: `/my-case` for applicant, `/lawyer/cases/[clientId]` for lawyer. Both have separate route groups with separate layouts.

**Changes:**

1. **New shared route**: `app/cases/[clientId]/` with role-aware layout
   - `layout.tsx`: lawyer gets dual sidebar (primary collapsed + case sidebar), applicant gets AppSidebar + content
   - `page.tsx`: overview (case header + summary)

2. **Redirect /my-case**: convert `app/(dashboard)/my-case/page.tsx` to server component that fetches user's clientId, `redirect('/cases/${clientId}')`

3. **Update AppSidebar**: "My Case" nav resolves to `/cases/[clientId]` dynamically via RoleProvider's clientId

4. **Move drafts routes**: unify `(lawyer)/cases/[clientId]/drafts/` and `(dashboard)/cases/[clientId]/drafts/` under `app/cases/[clientId]/drafts/`

5. **Middleware**: allow both roles on `/cases/*`, rely on `lib/case-auth.ts` for case-level auth

---

## D3. Secondary Case Sidebar

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

## D4. Lawyer Dashboard Redesign

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

## D5. Dashboard Assistant Agent

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

## File Summary

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

## Implementation Order

1. D1 (role context) -- no breaking changes
2. D2 (unified routing) -- structural change
3. D3 (case sidebar) -- depends on D2
4. D4 (dashboard redesign) -- parallel with D2+D3
5. D5 (dashboard agent) -- depends on D4

---

## Open Questions

- Dual `<Sidebar>` in one `<SidebarProvider>` -- supported by shadcn? may need custom wrapper
- "File type" column -- visa category (EB-1A) or document format?
- "Create case" button -- stub only or skip?
- "Check Deadlines" -- no deadline fields in schema; agent returns "no data" or add schema?
- Timeline page -- placeholder text or skip route entirely?
- Should `/cases/[clientId]` live in route group `(cases)` or bare at top level?
