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
