# Legal AI Platform - PRD Overview

**Version:** 1.0  
**Date:** January 25, 2026  
**Stack:** Next.js 14+ (App Router), Vercel AI SDK, PostgreSQL, Prisma

---

## Architecture

**Single-tenant standalone application** - No multi-tenancy or organization scoping. Deploy as separate instances for different clients (licensing model).

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
├─────────────────────────────────────────────────────────┤
│  Pages                    │  API Routes                 │
│  ├── /assistant           │  ├── /api/assistant/*       │
│  ├── /vault               │  ├── /api/vaults/*          │
│  ├── /vault/[id]          │  ├── /api/workflows/*       │
│  ├── /workflows           │  ├── /api/history/*         │
│  ├── /history             │  ├── /api/prompts/*         │
│  ├── /library             │  ├── /api/examples/*        │
│  └── /settings            │  └── /api/starred/*         │
├─────────────────────────────────────────────────────────┤
│                    Vercel AI SDK                         │
│            (Streaming, Tool Calling, RAG)               │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL (Prisma)      │  S3 Storage    │  Vector DB │
│  - Users                  │  - Documents   │  - Embeddings│
│  - Vaults                 │                │              │
│  - Documents              │                │              │
│  - Workflows              │                │              │
│  - Prompts/Examples       │                │              │
│  - History                │                │              │
└─────────────────────────────────────────────────────────┘
```

---

## Core Entities

| Entity | Description |
|--------|-------------|
| **User** | Application user with email, name, avatar |
| **Vault** | Document collection (knowledge_base or sandbox) |
| **Document** | File stored in vault with metadata and embedding status |
| **Workflow** | Pre-built automation template (draft, review_table, extraction, transformation) |
| **WorkflowStep** | Individual step within a workflow |
| **Prompt** | Reusable query template (system or personal) |
| **Example** | Demonstration query with response |
| **AssistantQuery** | Single AI query with input/output |
| **SourceReference** | Link between query and its sources |
| **HistoryEntry** | Audit log entry |
| **StarredItem** | User bookmark for prompts/examples |

---

## Feature Modules

### 1. Assistant (`/assistant`)
Primary AI chat interface with streaming responses.
- Natural language input with @mention source selection
- Output types: Chat, Draft Document, Review Table
- Source selection: Vaults, external databases
- Deep analysis toggle
- Prompt library quick access
- Recommended workflows

### 2. Vault (`/vault`)
Document repository management.
- Vault list with grid/list view
- Create vault (knowledge_base or sandbox)
- File upload with progress
- Document type classification
- Quick query launcher
- Review table creation

### 3. Workflows (`/workflows`)
Pre-configured automation templates.
- Categorized grid (General, Transactional)
- Filter by output type
- Step-by-step execution interface
- Streaming output

### 4. History (`/history`)
Query audit trail.
- Searchable history table
- Filter by date, type, source
- Group by options
- Expandable detail view

### 5. Library (`/library`)
Prompts and examples repository.
- System and personal prompts
- Example demonstrations
- Starring/bookmarking
- Quick insert to Assistant

---

## System Workflows (Seed Data)

**General:**
- Draft a Client Alert
- Draft from Template
- Extract Timeline of Key Events
- Proofread for Spelling and Grammar
- Summarize Interview Calls
- Transcribe Audio to Text
- Translate into Another Language

**Transactional:**
- Analyze Change of Control Provisions
- Draft an Interim Operating Covenants Memo
- Draft an Item 1.01 Disclosure
- Extract Key Data from Contracts
- Extract Terms from Agreements (multiple subtypes)

---

## Requirements Summary

| Category | Count |
|----------|-------|
| Setup | 5 |
| Data Model | 12 |
| UI | 35 |
| Functional | 15 |
| API | 15 |
| Performance | 3 |
| Error Handling | 3 |
| **Total** | **88** |

See `prd_requirements.json` for detailed testable requirements.

---

## Files

| File | Description |
|------|-------------|
| `prd_requirements.json` | 88 testable requirements in JSON format |
| `schema.prisma` | Database schema (Prisma) |
| `prd_overview.md` | This document |

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/legal_ai"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AI Provider
ANTHROPIC_API_KEY="sk-ant-..."

# Storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="legal-ai-documents"

# Vector Database (optional)
PINECONE_API_KEY="..."
PINECONE_INDEX="legal-ai-embeddings"
```

---

## Quick Start

```bash
# 1. Create Next.js project
npx create-next-app@latest legal-ai --typescript --tailwind --app

# 2. Install dependencies
npm install prisma @prisma/client ai @ai-sdk/anthropic
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# 3. Initialize Prisma
npx prisma init

# 4. Copy schema.prisma and run migrations
npx prisma migrate dev --name init

# 5. Seed workflows
npx prisma db seed

# 6. Start development
npm run dev
```
