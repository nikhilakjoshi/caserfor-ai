# Assumptions

## Database
- PostgreSQL will be used (not SQLite or other DBs)
- DATABASE_URL env var follows standard postgres:// format
- Dev will provide their own PostgreSQL instance

## Prisma 7
- Using Prisma 7 adapter pattern (not legacy url-in-schema)
- PrismaPg adapter with node-postgres (pg) Pool
- Client throws if DATABASE_URL not set (fail-fast)

## StarredItem Model
- Removed polymorphic Prisma relations (Prompt/Example) from StarredItem
- App code handles lookup via itemType + itemId string
- This avoids Prisma's limitation with shared foreign key columns

## AI Provider
- Google Gemini is the primary AI provider
- Dev will provide their own GOOGLE_GENERATIVE_AI_API_KEY
- Using gemini-2.5-flash as default model, gemini-2.5-pro for analysis
- toTextStreamResponse() used (not toDataStreamResponse which doesn't exist in current ai SDK)

## React Hooks
- useCompletion/useChat from @ai-sdk/react package (not ai/react)
- ai v6+ split React hooks into separate @ai-sdk/react package

## File Storage
- File content stored as base64 in Document.metadata.content field (no S3)
- storageKey field populated with path format: vaults/{vaultId}/{uuid}.{ext}
- Production should migrate to S3 - remove content from metadata, use storageKey for S3 get

## EditorDocument Model
- Named EditorDocument to avoid collision with existing Document model (vault files)
- PRD says "Document" but that name was taken - EditorDocument used instead
- One-to-one with AssistantQuery via unique queryId
- Content field stores TipTap editor JSON format

## Embedding Pipeline
- pdf-parse v2 uses class-based API (not the v1 default-export function)
- Chunking uses ~4 chars/token heuristic (not tiktoken) for simplicity
- Pinecone VectorMetadata needs index signature `[key: string]: string | number` for RecordMetadata compatibility
- text-embedding-004 produces 768-dimensional vectors
- Pinecone index must be configured for 768 dimensions

## S3 Storage
- AWS credentials provided via env vars (not IAM role/instance profile)
- S3 bucket already exists and is configured for the account
- downloadFile uses async iteration on response Body stream (Node.js compatible)
- Presigned URLs default to 1 hour expiry

## SourceType Enum
- 'document' added to SourceType enum (PRD said "after 'document'" but it wasn't there)
- Code was already using sourceType: "document" - enum needed to match
- Order: vault, document, agent, external_database, system_knowledge

## AI SDK Tool Definition
- AI SDK v5+ renamed `parameters` to `inputSchema` for tool definitions
- PRD mentions `parameters` but codebase uses `inputSchema` per current SDK
- Agent sub-tools use generateText (not ToolLoopAgent) since they have no tools themselves

## AI SDK ToolLoopAgent
- ToolLoopAgent uses `instructions` (not `system`) for system prompt
- createAgentUIStreamResponse uses onStepFinish callback (not onFinish) for per-step events
- Tool calls have `input` property (not `args` as in some older SDK versions)
- Tool results have `output` property (not `result`)
- Final step detected by checking `finishReason !== "tool-calls"`

## AI SDK useChat Hook
- useChat returns messages array with UIMessage format (not completion string)
- UIMessage has .parts array containing TextUIPart, ToolUIPart, etc.
- Tool parts have type `tool-{toolName}` (e.g., `tool-agent_legal_advisor`), not `tool-invocation`
- DefaultChatTransport body option uses function returning object (ref pattern for dynamic values)
- Custom fetch option on transport allows header interception (e.g., X-Query-Id)
- status === "streaming" replaces isLoading boolean

## AI SDK generateText Multi-Step
- AI SDK v5+ removed `maxSteps` from generateText - use `stopWhen: stepCountIs(N)` instead
- `stepCountIs` imported from `ai` package
- Default stopWhen is stepCountIs(1) - must set explicitly for multi-step tool use
- generateText with tools + stopWhen is equivalent to ToolLoopAgent for non-streaming use cases

## Stripe Payment
- ENABLE_STRIPE env var controls whether real Stripe is used (default "false" = bypass)
- Checkout route returns { redirectUrl } - client-side handles redirect via window.location.href
- Base URL derived from request Host header (localhost = http, otherwise https)
- Webhook uses req.text() for raw body (Stripe signature verification needs raw string, not parsed JSON)
- Migration not run as part of implementation - dev runs prisma migrate when DB available

## Authentication
- NextAuth v5 (beta.30) with credentials provider and JWT session strategy
- Passwords hashed via bcryptjs
- Layout-level auth enforced via middleware.ts (not per-layout server checks) because dashboard layout is "use client"
- No @auth/prisma-adapter used - JWT tokens carry id + role, no DB session table
- Module augmentation for JWT type uses `as` casts since nested @auth/core/jwt module path doesn't resolve reliably
- Public routes: /, /login, /api/auth/*, /api/payments/webhook, /_next/*, /favicon*
- Admin role has access to all protected routes

## Expanded Onboarding (10-Step Flow)
- step-criteria.tsx NOT renamed to step-evidence.tsx - kept existing name for stability
- step-personal.tsx, step-docs-timeline.tsx, step-impact.tsx are now unused but not deleted (avoid breaking any potential imports)
- Resume upload in step 3 now parses and pre-fills fields via AI (resume-parser built)
- Resume parser uses defaultModel (gemini-2.5-flash) not gemini-2.0-flash as PRD specifies - 2.0 unavailable
- Resume confidence is client-side only state, not persisted to DB or API
- Parse-resume endpoint accepts documentId (not raw file) - document must already be uploaded to S3
- Impact & Standing data not collected in 10-step flow (was step 4 in old flow, removed to simplify)
- Evidence checklist and document upload from old step-docs-timeline moved to step-criteria (step 5)
- Old step 5 timeline fields moved to step-circumstances (step 8)
- Old step 5 alt categories moved to step-preferences (step 9)

## Onboarding Reset
- Reset endpoint deletes EligibilityReport in addition to CriterionResponses/Documents (PRD didn't mention it but necessary for clean slate)
- S3/Pinecone failures during reset are non-fatal - DB cleanup always proceeds
- Reset redirects to /onboarding (root) which re-fetches draft and redirects to step 1
- Vault is preserved (not deleted) - only its contents and name are reset

## Role-Based Vault Access
- No SessionProvider on client side - auto-select uses vault count heuristic (1 vault = applicant) instead of role check
- Vault modal not fully hidden for applicants - still accessible for file browsing, just auto-selected
- canAccessVault checks Vault->Client->userId path for applicants, Vault->Client->CaseAssignment for lawyers
- Other vault sub-routes (presign, process, retry, doc PATCH) not yet protected - should add canAccessVault

## Lawyer Dashboard
- Session check for lawyer role handled by middleware.ts (not in layout) since layout is "use client"
- Cases API filters out draft clients - lawyers only see submitted+ intakes
- Dashboard fetches user ID from /api/auth/session endpoint client-side for assign button
- Lawyer sidebar is separate component from AppSidebar (not a mode/prop toggle) for simplicity

## Gap Analysis
- GapAnalysis is a separate model (not reusing EligibilityReport) - stores multiple runs per client
- Uses defaultModel (gemini-2.5-flash) not analysisModel for speed
- Refresh endpoint runs async, client polls for results
- Case detail vault tab now embeds ClientVaultDocuments inline (read-only); "Full Vault View" link preserved for edit access
- Case detail assistant tab uses autoSelectAll=1 param to pre-attach all vault files on assistant page
- Assistant page autoSelectAll fetches all docs and attaches them without file picker step
- Case detail requires CaseAssignment for lawyer access (admin bypasses)

## Recommender/Drafting Data Layer
- Client.recommenders Json field renamed to recommenderNotes (not deleted) to preserve onboarding intake data
- Onboarding form still sends field as "recommenders" in request body; API maps to recommenderNotes
- prisma db push not run during implementation - dev runs when DB available
- CaseDraft unique constraint [clientId, documentType, recommenderId] allows null recommenderId (Postgres treats nulls as distinct)

## Case Auth Helper
- authorizeCaseAccess returns NextResponse on error (not throw) - callers use isAuthError() type guard
- PRD says "throws appropriate HTTP error" but return pattern matches existing codebase style (gap-analysis route etc)
- Helper also fetches and returns client record to avoid redundant DB query in route handlers

## LinkedIn Extraction
- extractLinkedInProfile uses Output.object() (single-pass structured output) not agentic tool loop - PDF text is self-contained context
- LinkedIn extraction checks both AI-categorized and pre-assigned documentType via `resolvedCategory`
- Extraction runs fire-and-forget after categorization resolves (parallel with nothing - embedding already done by then)
- No deduplication of recommenders from LinkedIn extraction - multiple uploads may create duplicates

## Petition Letter Drafting Agent
- PRD says "section-by-section sequentially (token strategy)" but implemented as single structured output call for simplicity - can switch to sequential section generation if token limits hit
- TipTap JSON uses basic node types (doc, heading, paragraph, bulletList, listItem, text with marks) - no custom node types
- markdownToTiptapParagraphs is a lightweight converter, not a full markdown parser - handles h3, bullets, bold, italic only
- Exhibit references are placeholder ("Exhibit X") - no auto-numbering against actual vault documents yet

## Personal Statement Drafting Agent
- PRD says "single generation call" but implemented as two-phase (research + generate) like petition-letter for better context gathering
- Research phase uses stepCountIs(15) vs petition-letter's 25 - personal statement needs less evidence mining
- markdownToTiptapParagraphs duplicated from petition-letter rather than extracted to shared util - acceptable until 3+ agents share it

## Recommendation Letter Drafting Agent
- Uses defaultModel (gemini-2.5-flash) not gemini-2.5-pro - PRD says "gemini-2.5-flash" which matches
- Research phase uses stepCountIs(20) - between petition-letter (25) and personal-statement (15) since rec letters need recommender + applicant context
- markdownToTiptapParagraphs now duplicated in 3 files - should extract to shared util with next agent

## Draft Generation API Route
- PRD says "streams response" but agents return complete results (research loop + structured output) - used fire-and-forget async pattern instead (matches gap-analysis refresh)
- On generation failure, status reverts to not_started so user can retry
- JSON.parse(JSON.stringify()) used for tiptap/sections to satisfy Prisma's InputJsonValue type

## Cover Letter Drafting Agent
- Uses stepCountIs(15) like personal-statement - cover letter is a summary doc, less research needed than petition letter
- markdownToTiptapParagraphs duplicated (now in 4 files) - acceptable until extracted to shared util
- PRD says "System prompt for petition package cover letter" - implemented with full legal correspondence structure including INA/CFR citations

## Exhibit List Drafting Agent
- Uses stepCountIs(20) - more research than cover letter (15) since it needs to exhaustively catalog all vault documents
- PRD says "Should reference vault documents" - research phase uses multiple targeted vault searches (evidence, awards, publications, etc.)
- markdownToTiptapParagraphs duplicated (now in 5 files) - should extract before next agent

## Table of Contents Drafting Agent
- Uses defaultModel (gemini-2.5-flash) matching PRD spec
- Uses stepCountIs(15) - similar to cover letter since TOC is a summary/organizational doc, not heavy research
- PRD says "Uses get_existing_drafts to reference all other drafts" - research phase calls this plus vault searches
- markdownToTiptapParagraphs duplicated (now in 6 files) - critical to extract to shared util

## RFE Response Drafting Agent
- Uses analysisModel (gemini-2.5-pro) matching PRD spec for complex/long documents
- Uses stepCountIs(25) same as petition letter - RFE responses require equally thorough evidence gathering
- Research phase includes searching for RFE notice/USCIS correspondence in vault (may not exist yet)
- markdownToTiptapParagraphs duplicated (now in 7 files) - must extract before next agent

## Per-Section Regeneration
- PRD says "streams response" for regenerate route but implemented as fire-and-forget (202 Accepted) matching existing generate route pattern
- Section replacement in TipTap JSON identifies target section by heading node with matching id attr, replaces content until next h2 heading
- Uses defaultModel (gemini-2.5-flash) not gemini-2.5-pro - section regen is a focused task, not full doc generation
- markdownToTiptapParagraphs duplicated again (now in 8 files) - shared util extraction increasingly critical

## RecommenderDetail Component
- Download link for recommender attachments uses placeholder URL pattern `/api/vaults/presign?key=` - no generic presign-by-storageKey endpoint exists yet
- Existing presign endpoint is document-specific (requires vaultId + docId) so recommender attachments need their own presign route or a generic one
- Component re-exports RecommenderStatus/statusConfig from recommender-list.tsx types rather than duplicating the enum

## Drafting Workspace Page
- TipTap JSON stored in draft.content is converted to HTML client-side for the DocumentEditor (which accepts HTML string)
- Custom tiptapToHtml renderer handles basic node types (heading, paragraph, bulletList, orderedList, listItem, blockquote, codeBlock, text with marks)
- Auto-save sends plainText (editor HTML) only - does not reverse-convert HTML back to TipTap JSON. Full TipTap JSON content is only set by AI generation.
- Version restore UI shows confirmation dialog but actual restore requires a GET /versions/[versionId] endpoint that doesn't exist yet - version list only returns metadata
- Section regeneration polls once after 5s delay then refreshes draft - not true real-time polling
- AI panel width is fixed 340px (not percentage-based ~40% as PRD suggests) for consistent layout

## Applicant Dashboard
- PRD says "Add Recommenders section to applicant dashboard" - created as new `/my-case` page under `(dashboard)` layout, not embedded in existing page (no applicant dashboard page existed)
- `/api/my-case` resolves client via `findFirst({ userId, status: { not: "draft" } })` - assumes one active case per user
- Applicant status limitations enforced by UI omission (no AI suggest button, no status dropdown) not API-level role checks on status field
- "My Case" added to AppSidebar (shared by all roles) - lawyers also see this nav item but will get 404 since they have no Client record owned by them

## RoleProvider (D1)
- RoleProvider wraps at root layout level (not per-layout) so useRole is available everywhere
- DevRoleToggle only changes client-side context, not JWT/session - middleware still enforces real role
- RoleProvider returns null (no children) until session fetch completes - prevents FOUC but adds small delay
- clientId is fetched from /api/my-case for all users - lawyers will get a silent 404 (clientId stays null)

## Cases Route Group (D2)
- (cases) layout uses LawyerSidebar for lawyer/admin, AppSidebar for applicant - no CaseSidebar yet (D3)
- Drafts routes copied (not moved) from (lawyer) to (cases) - both exist simultaneously until lawyer case detail is refactored to use /cases/ routes
- /cases/* middleware access: no explicit restriction needed since middleware only blocks specific route prefixes (/onboarding, /evaluation, /lawyer). All authenticated users can access /cases/* - actual auth is in API via authorizeCaseAccess
- Unified /api/cases/[clientId] route created alongside existing /api/lawyer/cases/[clientId] - both coexist, unified route uses authorizeCaseAccess for multi-role support
- my-case server redirect uses prisma directly (not API call) since it's a server component - avoids extra HTTP hop
- AppSidebar My Case isActive check matches both /cases/ and /my-case paths for highlight consistency during redirect

## CaseSidebar (D3)
- CaseSidebar placed inside same SidebarProvider as LawyerSidebar - shares collapse state. Independent collapse would need nested providers.
- CaseSidebar only renders for lawyer/admin roles - applicants navigate via main AppSidebar links
- Vault/assistant sub-pages fetch full case data just to get vaultId - acceptable for now, could use shared context later
- Gap analysis sub-page uses `/api/lawyer/cases/[clientId]/gap-analysis` directly (not unified API) since no unified gap-analysis route exists yet
- Recommenders sub-page role-gates Add button and AI suggestions via useRole() client-side check (not API-level)
- Timeline is placeholder only - no toast, just static "coming soon" text (simpler than PRD's "toast" spec)
- Draft type sub-links use `?type=slug` query param - drafts index page doesn't filter by this yet
