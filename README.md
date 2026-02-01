# Legal Workflow

EB-1A extraordinary ability visa eligibility platform. Combines structured client intake, document management, RAG-powered evidence search, and AI-driven evaluation to help immigration attorneys assess petition strength.

## Technical Overview

| Layer | Stack |
|-------|-------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Database | PostgreSQL + Prisma 7 ORM |
| Vector DB | Pinecone (namespace-per-vault) |
| File Storage | AWS S3 (presigned URLs, 25MB limit) |
| LLM | Google Gemini 2.5 Flash/Pro via Vercel AI SDK |
| Embeddings | Google `text-embedding-004` (768d) |
| UI | TailwindCSS 4, Radix UI, Tiptap editor, React Hook Form + Zod |

### Architecture

- **App Router** with server components and streaming API routes
- **RAG pipeline**: upload -> extract text (PDF/DOCX/TXT) -> chunk (1000 tokens, 200 overlap) -> embed -> store in Pinecone -> query at inference time
- **Tool-calling agents**: Vercel AI SDK `ToolLoopAgent` with dynamically created tools from DB models. EB-1A evaluator uses `get_intake_data` and `search_evidence` tools
- **Document processing**: pdf-parse, mammoth for extraction; AI-powered categorization into 18 document types (10 EB-1A evidence + 8 general legal)
- **Streaming responses** via `createAgentUIStreamResponse()` with SSE to client

### Key Directories

```
app/onboarding/          # 6-step intake flow (pages + components)
app/(dashboard)/         # Main app: assistant, vault, agents, workflows
app/api/                 # All API routes
lib/                     # Core logic: RAG, embeddings, evaluator, chunker, S3
prisma/schema.prisma     # Full data model
components/ui/           # Radix-based component library
```

### Environment

```
DATABASE_URL, GOOGLE_GENERATIVE_AI_API_KEY, PINECONE_API_KEY,
PINECONE_INDEX, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
AWS_REGION, AWS_S3_BUCKET
```

```bash
npm install && npm run db:push && npm run db:seed && npm run dev
```

---

## Functional Overview

### 1. EB-1A Client Intake (6 Steps)

Guided onboarding flow collecting everything needed for an EB-1A assessment:

1. **Personal Background** -- name, contact, citizenship, education, field of expertise, US intent
2. **Major Achievement** -- Nobel-level or equivalent one-time accomplishment (optional)
3. **10 EB-1A Criteria** -- tabbed interface with 2-4 targeted questions per criterion:
   - Awards, Membership, Press, Judging, Original Contribution, Scholarly Articles, Exhibitions, Leading Role, High Salary, Commercial Success
4. **Impact & Standing** -- social following, keynotes, recommenders, self-assessment, recognition scope
5. **Documents & Timeline** -- evidence checklist, urgency, prior consultations, alternative EB categories
6. **Review & Submit** -- summary view, document upload, triggers AI evaluation on submit

Criteria responses auto-save. Visual indicators show completion status per criterion.

### 2. AI-Powered EB-1A Evaluation

On intake submission, an AI agent evaluates eligibility:

- Retrieves all intake data via tool call
- Searches uploaded evidence per criterion via RAG
- Scores each of 10 criteria (1-5 scale) against USCIS standards
- Produces overall verdict: **strong** (4+ criteria >= 4), **moderate** (3+ >= 3), **weak** (1-2 >= 3), **insufficient** (0 >= 3)
- Generates detailed analysis with cited evidence per criterion
- Stores `EligibilityReport` with verdict, summary, per-criterion breakdown, and raw output

### 3. Document Vault

Organize and process supporting evidence:

- Create vaults (knowledge_base or sandbox types)
- Upload documents (PDF, DOCX, TXT, MD) up to 25MB
- Automatic pipeline: text extraction -> chunking -> AI categorization -> vector embedding
- Embedding status tracking with retry on failure
- Presigned S3 URLs for secure download
- Search and sort across vaults

### 4. Assistant (Query Interface)

General-purpose AI assistant with legal context:

- Chat and document drafting modes
- Select vault sources for RAG context
- Deep analysis toggle (switches to Gemini Pro)
- Attach custom agents as callable tools
- Streaming responses with source attribution
- Full query history with token/latency tracking

### 5. Custom Agents

User-defined specialized AI personas:

- Name, description, system prompt
- Automatically exposed as tools in the assistant
- AI-generated instruction option
- Test interface before deployment

### 6. Workflows

Pre-built legal task templates (seeded):

- Draft Client Alert, Extract Timeline, Proofread, Redact Sensitive Info, Assess Compliance, etc.
- Multi-step with configurable output types (draft, review_table, extraction)
- Column schema support for structured extraction

### 7. Library & History

- Save and star prompts, examples, queries
- Full query history with search
- Source reference tracking (vault, document, agent, external)

---

### Data Model (Core Entities)

- **Client** -- intake data, status (draft/submitted/under_review/reviewed), linked vault
- **CriterionResponse** -- per-criterion answers (one per criterion per client)
- **EligibilityReport** -- AI verdict + per-criterion scores + analysis
- **Vault** / **Document** -- file storage with embedding lifecycle
- **AssistantQuery** / **SourceReference** -- query history with data lineage
- **Agent** -- custom AI agents with system prompts
- **Workflow** / **WorkflowStep** -- task templates with step configs
