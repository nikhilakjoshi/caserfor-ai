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
