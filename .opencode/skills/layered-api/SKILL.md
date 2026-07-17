---
name: layered-api
description: Use when implementing or reviewing Next.js App Router API endpoints with route/service/repository layering in this project.
---

# Layered API

Use this workflow for backend endpoints in this project.

## Structure

- Route handlers: `app/api/<resource>/route.ts` or `app/api/<resource>/[id]/route.ts`.
- Service layer: `modules/<resource>/<resource>.service.ts`.
- Repository layer: `modules/<resource>/<resource>.repository.ts`.
- Validation: `modules/<resource>/<resource>.schema.ts`.
- Types: `modules/<resource>/<resource>.types.ts`.

## Rules

- Route handlers should parse request input, validate it, require auth when protected, and call services.
- Services own business rules and throw `AppError` for expected failures.
- Repositories own Prisma calls and transactions.
- Use `success` and `failure` from `lib/response.ts`.
- Do not import Prisma directly into route handlers.

## Verification

- Run `npm run lint`.
- Run `npm run build`.
- For database changes, run `./node_modules/.bin/prisma generate`.
