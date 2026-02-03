# PRD: Recommendation Letter Drafting Workspace

## Overview

Add an inline 3-panel drafting workspace to the recommenders tab in the lawyer case view. When a lawyer clicks "Draft Letter" on a recommender, the recommenders list is replaced with a dedicated workspace: chat (left 1/4), Tiptap editor (center 2/4), actions (right 1/4). A new conversational AI agent handles initial generation and iterative refinement via chat. The editor supports real-time streaming, manual editing, versioning, per-section regeneration, and exporting the final letter back to the case vault as a PDF.

## Goals

- Lawyer can draft a recommendation letter for any recommender without leaving the recommenders tab
- AI-assisted generation with streaming into a full Tiptap editor
- Chat-based iterative refinement: edit sections, change tone, add detail
- Version history for tracking changes
- Add-to-vault export: PDF conversion + vault upload triggering embedding + gap analysis refresh
- Reuse existing DocumentEditor, versioning APIs, and drafting tool infrastructure

## Non-Goals

- Persisted chat history (ephemeral only)
- Multi-user collaborative editing
- Email sending to recommenders
- Template library for recommendation letters

## User Stories

1. Lawyer views recommenders list, clicks "Draft Letter" on a confirmed recommender
2. Workspace opens inline: empty editor + actions panel + chat panel
3. Lawyer clicks "Generate Full Letter" in actions panel -> AI streams letter into editor
4. Lawyer reads letter, types in chat: "Make the second paragraph more specific about the ML contributions"
5. AI edits that section in-place, streaming changes into editor
6. Lawyer manually edits a sentence directly in the editor
7. Lawyer saves a version snapshot with note "v1 after initial generation"
8. Lawyer clicks "Add to Vault" -> PDF created, uploaded to vault, triggers embedding pipeline
9. Lawyer clicks "Back to Recommenders" to return to list view

## Functional Requirements

### F1: Draft Letter Entry Point

**Files:** `components/recommender/recommender-list.tsx`, `components/recommender/recommender-detail.tsx`

- Add "Draft Letter" action to recommender row dropdown and detail panel
- On click: auto-create CaseDraft (type=recommendation_letter, recommenderId=X) if none exists, via existing POST `/api/cases/[clientId]/drafts`
- Set parent state to show workspace view, passing draft + recommender data

### F2: 3-Panel Workspace Layout

**Create:** `components/recommender/rec-letter-workspace.tsx`

- Replaces recommenders list inline (no route change, same tab)
- Header: back button + "Drafting: {Recommender Name}" + status badge
- Layout: `flex` with `w-1/4 | w-2/4 | w-1/4`
- All panels scrollable independently

```
[Back to Recommenders]  |  Drafting: {Recommender Name}  |  [status badge]
---------------------------------------------------------------------------
| Chat (1/4)       | Editor (2/4)         | Actions (1/4)                |
| - ephemeral msgs | - DocumentEditor     | - Recommender context card   |
| - AI responses   | - streaming support  | - Generate Full Letter       |
| - input box      | - auto-save          | - Section list + regenerate  |
|                  |                      | - Version history            |
|                  |                      | - Add to Vault               |
---------------------------------------------------------------------------
```

### F3: Editor Panel (Center 2/4)

**Reuse:** `components/editor/document-editor.tsx`

- Streaming support (existing `isStreaming` prop pattern from draft workspace)
- Auto-save with 2s debounce via PATCH `/api/cases/[clientId]/drafts/[id]`
- Read-only during generation, editable otherwise
- Prose styling matching existing draft workspace
- Clone patterns from `app/(cases)/cases/[clientId]/drafts/[id]/page.tsx`

### F4: Actions Panel (Right 1/4)

**Create:** `components/recommender/rec-letter-actions.tsx`

- **Recommender Context** (top): name, title, org, relationship, criteria tags, AI reasoning -- read-only reference card
- **Generate Full Letter**: POST `/api/cases/[clientId]/drafts/[id]/generate` (existing endpoint, uses recommendation_letter agent for initial gen). Disabled during generation
- **Section List**: clickable sections with optional instruction input + regenerate button. Uses existing POST `/api/cases/[clientId]/drafts/[id]/regenerate`
- **Version History**: save version button + version list dropdown. Uses existing version endpoints (POST/GET `/api/cases/[clientId]/drafts/[id]/versions`)
- **Add to Vault**: convert draft to PDF, upload to vault, trigger processing pipeline. New endpoint (see F8)

### F5: Chat Panel (Left 1/4)

**Create:** `components/recommender/rec-letter-chat.tsx`

- Ephemeral message list (React state, resets on unmount)
- Input at bottom (textarea with send button)
- Streams AI responses inline
- AI can: edit specific sections, refine tone, expand content, answer questions about the letter
- Each chat turn sends current editor content as context so AI always works with latest state
- Visible affordances: suggestion chips like "Make more formal", "Strengthen [criterion] section"

### F6: Conversational Agent

**Create:** `lib/drafting-agents/rec-letter-chat-agent.ts`

New pattern -- unlike existing fire-and-forget agents, this is conversational:

- System prompt: EB-1A recommendation letter legal writing expert
- Tools (extends `createDraftingTools(clientId)`):
  - All existing: `get_client_profile`, `search_vault`, `get_gap_analysis`, `get_eligibility_report`, `get_recommender`
  - New: `get_current_draft` - reads current editor content passed in request
  - New: `update_draft_section` - returns replacement for specific section (by heading)
  - New: `update_full_draft` - returns full document replacement
- Streaming output for both chat text and editor operations
- Maintains conversation context per request (messages array passed from frontend)

### F7: Chat API Route

**Create:** `app/api/cases/[clientId]/recommenders/[id]/draft-chat/route.ts`

- POST with `{ messages: Message[], currentContent: string }`
- Streaming response
- Auth: `authorizeCaseAccess(clientId)`
- Invokes rec-letter-chat-agent with full message history + current editor state

### F8: Add to Vault

**Create:** `app/api/cases/[clientId]/recommenders/[id]/add-to-vault/route.ts`

- POST (no body needed, reads draft from DB)
- Flow:
  1. Fetch CaseDraft for this recommender
  2. Convert HTML content to PDF
  3. Upload PDF to S3
  4. Create VaultDocument record linked to client's vault
  5. Trigger document processing pipeline (embedding)
  6. Existing behavior: gap analysis auto-refreshes after embedding
- Updates recommender status to `letter_drafted`
- Returns: created document metadata

## Technical Considerations

- `DocumentEditor` already handles streaming with cursor preservation -- reuse as-is
- Existing draft CRUD + versioning APIs cover generation, save, version snapshot
- Chat agent is new pattern. Other agents are fire-and-forget background jobs. This one is request-scoped conversational with streaming
- PDF conversion lib needed (puppeteer, html-pdf, or jspdf) -- TBD
- Add-to-vault reuses existing vault document processing pipeline (`/api/vaults/[id]/documents/process`)
- The `CaseDraft` model already has `recommenderId` FK and unique constraint on `[clientId, documentType, recommenderId]`

## Edge Cases

- No draft exists yet: auto-create on "Draft Letter" click
- Draft already in "generating" state when workspace opens: show streaming/polling UI
- Empty draft on "Add to Vault": disable button with tooltip
- Chat + manual edit conflict: chat always reads latest editor state before each AI response
- Recommender with minimal info (no criteria, no reasoning): agent works with whatever context is available
- Version restore: replaces editor content, does not clear chat
- Multiple recommenders with drafts: each gets independent workspace instance

## Open Questions

- PDF conversion lib? (puppeteer vs html-pdf vs jspdf)
- "Add to Vault" set status to `letter_drafted` or `letter_finalized`?
- Max chat messages before truncating older messages from context?
