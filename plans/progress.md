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
