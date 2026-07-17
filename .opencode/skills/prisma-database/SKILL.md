---
name: prisma-database
description: Use when changing Prisma models, seed data, SQL create-table files, or repository database logic.
---

# Prisma Database

Use this workflow for database work.

## Files

- Prisma schema: `prisma/schema.prisma`
- Seed script: `prisma/seed.js`
- SQL schema: `database/create-tables.sql`
- Prisma client helper: `lib/prisma.ts`
- Repositories: `modules/**/**.repository.ts`

## Rules

- Keep `database/create-tables.sql` compatible with Prisma model table and column names.
- Use Prisma transactions for multi-step writes that must remain atomic.
- For stock updates, guard against race conditions with conditional updates.
- Keep seed data deterministic and documented in `README.md`.
- After schema changes, run Prisma generate.

## Verification

- `./node_modules/.bin/prisma generate`
- `npm run build`
- `npm run prisma:seed` when a local database is available.
