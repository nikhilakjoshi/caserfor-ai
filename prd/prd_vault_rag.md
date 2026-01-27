# PRD: Vault Document Management & RAG Pipeline

## 1. Overview

Transform the vault system from mock data to a fully functional document management platform with AI-powered categorization and RAG-based retrieval for the EB1A immigration workflow.

---

## 2. Current State

| Component | Status |
|-----------|--------|
| Vault CRUD UI + API | Implemented, uses mock data in places |
| Vault selection modal (assistant) | Hardcoded mock vaults ("Client Documents", "Legal Templates", "Research Papers") |
| Document upload API | Exists, stores base64 in Postgres metadata |
| Embeddings/Pinecone | Not implemented (schema has `embeddingStatus` field) |
| RAG retrieval | Not implemented |
| EB1A categorization | Not implemented |
| File storage (S3) | Not implemented |

---

## 3. Requirements

### 3.1 Fix Vault Selection Modal (Assistant Page)

**Problem:** "Choose Vault" in Files & Sources dropdown shows hardcoded mock vaults instead of real vaults from DB.

**Fix:**
- Replace `mockVaults` and `mockVaultsWithFiles` in `app/(dashboard)/assistant/page.tsx` with API calls to `GET /api/vaults` and `GET /api/vaults/[id]/documents`
- Fetch vaults on modal open, fetch documents on vault click

### 3.2 Vault Selection Modal UI Redesign

**Problem:** Current modal is 50vw x 50vh, too small.

**Requirements:**
- Modal: 90vw x 90vh, centered
- Use `frontend-design` skill for polished UI
- Two-state view:
  1. **Vault list** - grid of vault cards (name, type badge, file count, description)
  2. **Vault detail** - file table with checkboxes for multi-select
- Search/filter in both states
- Back navigation from detail to list
- Selected files summary bar at bottom with "Add to Chat" CTA
- Smooth transitions between states

### 3.3 Real Data in Vault Pages

**Problem:** `/vault` and `/vault/[id]` pages use mock data.

**Fix:**
- `/vault/page.tsx` - replace mock vault data with `GET /api/vaults` calls
- `/vault/[id]/page.tsx` - replace mock documents with `GET /api/vaults/[id]/documents` calls
- Loading states, empty states, error states

### 3.4 File Storage - S3

**Requirements:**
- Upload files to S3 instead of base64 in metadata
- **Max file size: 25MB** - enforce client-side and server-side
- Use AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- S3 key format: `vaults/{vaultId}/{uuid}.{ext}`
- Store S3 key in `Document.storageKey` (already exists in schema)
- Generate presigned URLs for download/preview
- Env vars in `.env.example`:
  ```
  AWS_ACCESS_KEY_ID=
  AWS_SECRET_ACCESS_KEY=
  AWS_REGION=
  AWS_S3_BUCKET=
  ```

### 3.5 Document Ingestion & Embedding Pipeline

**Requirements:**
- Use Vercel AI SDK's `embed()` / `embedMany()` functions
- Default embedding provider: Google (`@ai-sdk/google`) via `google.textEmbeddingModel('text-embedding-004')`
- Provider-agnostic: switching model = changing one config line in `lib/ai.ts`
- Chunking strategy:
  - Extract text from uploaded files (PDF via `pdf-parse`, DOCX via `mammoth`, TXT direct)
  - Chunk with overlap: ~1000 tokens per chunk, 200 token overlap
  - Each chunk gets embedded and stored in Pinecone
- Pinecone integration:
  - Use `@pinecone-database/pinecone` SDK
  - Namespace per vault: `vault-{vaultId}`
  - Vector metadata: `{ documentId, chunkIndex, text, documentName, documentType }`
  - Upsert vectors on upload, delete on document removal
- Update `Document.embeddingStatus` through lifecycle: pending -> processing -> completed | failed
- Process embeddings async via background worker endpoint (not blocking upload response)
- **Processing status polling:** UI polls `GET /api/vaults/[id]/documents` or per-document status endpoint to show `PROCESSING` / `COMPLETED` / `FAILED` badge on each document
- Pinecone serverless index, 768 dimensions (Google text-embedding-004)
- Env vars in `.env.example`:
  ```
  PINECONE_API_KEY=
  PINECONE_INDEX=
  ```

### 3.6 AI Document Categorization Agent

On upload, an AI agent categorizes each document into one of these categories:

**USCIS EB1A Criteria (10):**
1. `awards` - Awards or prizes for excellence
2. `membership` - Membership in associations requiring outstanding achievement
3. `published_material` - Published material about the person
4. `judging` - Participation as judge of others' work
5. `original_contribution` - Original contributions of major significance
6. `scholarly_articles` - Authorship of scholarly articles
7. `exhibitions` - Display of work at exhibitions or showcases
8. `leading_role` - Leading or critical role in distinguished organizations
9. `high_salary` - High salary or remuneration relative to others
10. `commercial_success` - Commercial successes in performing arts

**General Categories:**
11. `identity_document` - Passports, IDs, birth certificates
12. `immigration_form` - USCIS forms (I-140, I-485, etc.)
13. `correspondence` - Letters, emails, communications
14. `recommendation_letter` - Letters of recommendation/support
15. `resume_cv` - Resumes and CVs
16. `financial_document` - Tax returns, pay stubs, financial records
17. `legal_document` - Contracts, agreements, legal filings
18. `other` - Uncategorizable

**Implementation:**
- Use Vercel AI SDK `generateObject()` with structured output
- Input: first ~3000 tokens of document text + filename
- Output schema: `{ category: enum, confidence: number, reasoning: string }`
- Store category in `Document.documentType`
- Store confidence + reasoning in `Document.metadata`
- Run alongside embedding pipeline (non-blocking)
- **User override:** UI allows user to manually change the AI-assigned category via a dropdown on the document detail/row. Override stored in `Document.documentType`, original AI category preserved in `Document.metadata.aiCategory`

### 3.7 RAG in Chat

**Trigger:** User explicitly attaches files or selects vault files via Files & Sources.

**Flow:**
1. User attaches files from vault (via modal) or uploads directly
2. On query submit, for vault-sourced files:
   - Query Pinecone with embedded user question
   - Filter by document IDs of attached files
   - Retrieve top-K chunks (K=10)
3. For directly uploaded files:
   - Extract text inline
   - Chunk and include as context (no Pinecone, ephemeral)
4. Inject retrieved chunks into system prompt as context
5. AI generates response grounded in retrieved context
6. Source references stored in `SourceReference` table

**API changes to `/api/assistant/query`:**
- Accept `attachedFiles` with source type (vault vs upload)
- For vault files: query Pinecone, inject context
- For uploaded files: extract text inline, inject context

**Citations:**
- AI responses must include inline citations referencing source document + chunk
- Citation format: `[docName, p.X]` or similar marker
- Each citation links to document ID + chunk index
- Frontend renders citations as clickable links that open document preview at the cited location

### 3.8 Document Preview/Viewer

**Requirements:**
- Use `react-pdf` (or `react-pdf-viewer` - whichever is simpler) for PDF rendering
- Viewer opens in a side panel or modal when user clicks a document
- **Page navigation:** support jumping to specific pages via citation clicks
- **Text highlight:** when navigating from a citation, highlight or scroll to the relevant text passage
- Viewer controls: zoom, page nav, download
- Non-PDF files (DOCX/TXT): render as formatted text in same viewer shell
- Accessible from:
  - Vault detail page (click document row)
  - Chat citations (click citation link)

### 3.9 Processing Status UI

**Requirements:**
- Each document row shows embedding status badge: `PENDING` / `PROCESSING` / `COMPLETED` / `FAILED`
- UI polls document status every 3-5 seconds while any document is in `PENDING` or `PROCESSING` state
- Stop polling when all visible documents are `COMPLETED` or `FAILED`
- Failed documents show retry button
- API: `POST /api/vaults/[id]/documents/[docId]/retry` to re-trigger processing

---

## 4. Schema Changes

```prisma
// Add to Document model:
s3Key        String?   // redundant with storageKey but explicit
category     String?   // AI-assigned category from 3.6
categoryConfidence Float? // 0-1 confidence score

// Add enum values to DocumentType or use String field
```

Note: `Document.documentType` (String) and `Document.metadata` (Json) already exist and can store category info without schema changes. Evaluate if dedicated columns are cleaner.

---

## 5. New Dependencies

```
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
@pinecone-database/pinecone
pdf-parse
mammoth
```

Vercel AI SDK (`ai` package) already installed. `@ai-sdk/google` already installed.

---

## 6. New Files (Estimated)

| File | Purpose |
|------|---------|
| `lib/s3.ts` | S3 client singleton, upload/download/presign helpers |
| `lib/pinecone.ts` | Pinecone client singleton, upsert/query/delete helpers |
| `lib/embeddings.ts` | Embed text using AI SDK, chunking utilities |
| `lib/document-parser.ts` | Extract text from PDF/DOCX/TXT |
| `lib/categorization-agent.ts` | AI agent for document categorization |
| `lib/document-categories.ts` | Category enum/constants (EB1A + general) |
| `components/vault/document-viewer.tsx` | PDF/document preview component |
| `components/vault/category-selector.tsx` | Dropdown for manual category override |
| `components/vault/processing-status.tsx` | Status badge + polling logic |
| `app/api/vaults/[id]/documents/process/route.ts` | Background processing endpoint (embed + categorize) |
| `app/api/vaults/[id]/documents/[docId]/route.ts` | Single document ops (update category, retry) |
| `app/api/vaults/[id]/documents/[docId]/presign/route.ts` | Presigned URL for S3 download/preview |

---

## 7. Execution Order

1. S3 file storage setup (25MB limit enforcement)
2. Fix vault selection modal to use real data
3. Fix vault pages to use real data
4. Vault modal UI redesign (90vw x 90vh, polished)
5. Document text extraction (PDF/DOCX/TXT parser)
6. AI categorization agent + user override UI
7. Pinecone + embedding pipeline + processing status polling UI
8. Document preview/viewer (react-pdf) with citation navigation
9. RAG integration in chat query with inline citations

---

## 8. Resolved Questions

| Question | Decision |
|----------|----------|
| Pinecone type | Serverless, 768 dims (text-embedding-004). Implementation uses `PINECONE_API_KEY` only. |
| Max file size | 25MB |
| Embedding processing | Background worker endpoint; UI polls status (PROCESSING/COMPLETED/FAILED) |
| Document preview | Yes, using `react-pdf`. Must support citation-based navigation to specific pages/passages. |
| Category override | Yes, user can override via dropdown. Original AI category preserved in metadata. |
| Embedding batching | Batch in groups of 100 vectors per Pinecone upsert. Chunk embedding calls via AI SDK `embedMany()`. |
