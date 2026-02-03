# Cognee Integration Plan

## Architecture

Run Cognee as a **Python FastAPI server** alongside your Next.js app. Your Next.js API routes call Cognee's REST API via HTTP.

```
Next.js App (port 3000)
  |
  |-- HTTP requests -->  Cognee REST API (port 8000)
                            |
                            |-- PostgreSQL (existing, or separate)
                            |-- KuzuDB (local graph DB, zero-config)
                            |-- LanceDB (local vector DB, zero-config)
```

Pinecone stays for existing RAG. Cognee runs alongside it for graph-aware search.

## Cognee Server Setup

### 1. Create Python service directory

```
/cognee-server/
  .env              # Cognee-specific config
  requirements.txt  # or pyproject.toml
  start.sh          # startup script
```

### 2. Install & configure

```bash
cd cognee-server
python -m venv .venv && source .venv/bin/activate
pip install cognee
# or: pip install cognee[gemini] for Gemini support
```

`.env`:
```
LLM_PROVIDER=gemini
LLM_MODEL=gemini/gemini-2.0-flash
LLM_API_KEY=<your GOOGLE_GENERATIVE_AI_API_KEY>
EMBEDDING_PROVIDER=gemini
EMBEDDING_MODEL=gemini/text-embedding-004
EMBEDDING_API_KEY=<same key>
EMBEDDING_DIMENSIONS=768
DB_PROVIDER=sqlite
VECTOR_DB_PROVIDER=lancedb
GRAPH_DATABASE_PROVIDER=kuzu
REQUIRE_AUTHENTICATION=false
```

### 3. Start server

```bash
uvicorn cognee.api.client:app --host 0.0.0.0 --port 8000
```

Interactive docs at `http://localhost:8000/docs`

## Cognee REST API Endpoints (called from Next.js)

| Method | Endpoint | Body | Purpose |
|--------|----------|------|---------|
| POST | `/api/v1/add` | file upload or text | Ingest data |
| POST | `/api/v1/cognify` | `{"datasets": ["..."]}` | Build knowledge graph |
| POST | `/api/v1/search` | `{"query": "...", "datasets": [...], "top_k": 10}` | Search |
| DELETE | `/api/v1/delete` | dataset/document ID | Remove data |
| GET | `/health` | - | Health check |

## Changes to Next.js Codebase

### 1. New file: `lib/cognee.ts` - HTTP client

Thin wrapper around Cognee REST API:
- `cogneeAdd(text: string, dataset: string)` - POST to `/api/v1/add`
- `cogneeCognify(datasets: string[])` - POST to `/api/v1/cognify`
- `cogneeSearch(query: string, datasets: string[], topK?: number)` - POST to `/api/v1/search`
- `cogneeDelete(dataset: string)` - DELETE to `/api/v1/delete`

### 2. Update: Document upload pipeline (`/api/documents/upload`)

After existing S3 upload + Pinecone embedding, also:
- Extract text (already done)
- Call `cogneeAdd(extractedText, dataset=vault-{vaultId})`
- Call `cogneeCognify(["vault-{vaultId}"])`

### 3. Update: RAG layer (`lib/rag.ts`)

Add new function `queryRelevantChunksWithGraph()`:
- Calls Cognee search endpoint with `GRAPH_COMPLETION` search type
- Returns graph-aware results alongside existing Pinecone chunks
- Merge/deduplicate results

### 4. Update: Agent tools (`lib/drafting-tools.ts`, `lib/agent-tools.ts`)

Add `search_knowledge_graph` tool:
- Calls Cognee search with appropriate search type
- Available to all drafting agents and assistant

### 5. Update: Assistant query route (`/api/assistant/query/route.ts`)

- Add Cognee graph search results to RAG context
- Combine with existing Pinecone results

### 6. Multi-tenant isolation

Use Cognee datasets named `vault-{vaultId}` or `case-{clientId}` to isolate data per case/vault.

### 7. New env var

```
COGNEE_API_URL=http://localhost:8000
```

## File Changes Summary

| File | Change |
|------|--------|
| `cognee-server/` (new dir) | Python Cognee server setup |
| `lib/cognee.ts` (new) | HTTP client for Cognee API |
| `.env` | Add `COGNEE_API_URL` |
| `app/api/documents/upload/route.ts` | Add Cognee ingest after Pinecone |
| `lib/rag.ts` | Add graph-aware search function |
| `lib/drafting-tools.ts` | Add `search_knowledge_graph` tool |
| `lib/agent-tools.ts` | Expose Cognee search to custom agents |
| `app/api/assistant/query/route.ts` | Merge Cognee results into context |

## Verification

1. Start Cognee server, hit `/health` endpoint
2. Upload a document, verify it appears in both Pinecone and Cognee
3. Run assistant query, verify graph-aware results appear in context
4. Run drafting agent, verify it can use `search_knowledge_graph` tool

## Unresolved Questions

- Cognee `cognify()` is async/slow - run in background or block document upload?
- Should intake form data (CriterionResponse, Client profile) also be ingested into Cognee?
- Production deployment: run Cognee in same container/server or separate service?
- Rate limits on Gemini calls from Cognee (separate from your existing Gemini usage)?
