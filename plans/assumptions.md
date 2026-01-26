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
- Anthropic Claude is the primary AI provider
- Dev will provide their own ANTHROPIC_API_KEY
- Using claude-sonnet-4-20250514 as default model
- toTextStreamResponse() used (not toDataStreamResponse which doesn't exist in current ai SDK)

## React Hooks
- useCompletion/useChat from @ai-sdk/react package (not ai/react)
- ai v6+ split React hooks into separate @ai-sdk/react package

## File Storage
- File content stored as base64 in Document.metadata.content field (no S3)
- storageKey field populated with path format: vaults/{vaultId}/{uuid}.{ext}
- Production should migrate to S3 - remove content from metadata, use storageKey for S3 get
