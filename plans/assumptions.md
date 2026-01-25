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
