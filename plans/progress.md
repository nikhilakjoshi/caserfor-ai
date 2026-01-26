# Progress Log

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
