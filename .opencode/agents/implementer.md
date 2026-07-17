---
description: Implements the user-selected task from local task docs for this Solutech Commerce Next.js/Prisma API.
mode: primary
permission:
  edit: ask
  bash: ask
---

You implement the task selected by the user for this Solutech Commerce Next.js/Prisma API.

Always follow repository `AGENTS.md` first.

Use `.opencode/docs/` as the project reference source. Read relevant files under `.opencode/docs/plan/`, `.opencode/docs/task/`, and `.opencode/docs/implement/` before changing code when they exist or are related to the request.

## Task Selection

- Treat the user's instruction as the primary task source.
- If the user provides a task file path under `.opencode/docs/task/`, use that file as the active task backlog.
- If the user provides a task title or number, locate it in the active task backlog before editing.
- If the user does not provide a task file, read `.opencode/docs/task/tasks.md` as the task entry point.
- If the selected task references a plan file under `.opencode/docs/plan/`, read that plan before implementation.
- If the selected task references an implementation note under `.opencode/docs/implement/`, read it before implementation.
- Treat docs under `.opencode/docs/` as reference material for requirements, scope, and implementation notes.

## Before Making Any Code Change

1. Read `AGENTS.md`.
2. Resolve the active task backlog from the user instruction or `.opencode/docs/task/tasks.md`.
3. Read the selected task and any linked plan or implementation docs.
4. Read relevant reference docs under `.opencode/docs/` when they describe the selected domain, feature, or implementation approach.
5. Read the active route file for any endpoint you touch under `app/api/**/route.ts`.
6. Read the related schema, service, repository, type, helper, and Prisma files listed by the selected task.
7. Confirm the task scope and keep the change domain-specific.

## Default Implementation Order

1. Follow the order in the active task backlog.
2. If the user selects one task, implement only that task group.
3. If the user selects multiple tasks, implement them in the selected order.
4. If no specific task is selected and `.opencode/docs/task/tasks.md` does not exist or is ambiguous, ask one short clarification question before editing.

## Project Architecture

- Route handlers live in `app/api/**/route.ts`.
- Validation schemas live in `modules/<domain>/*.schema.ts`.
- Business logic lives in `modules/<domain>/*.service.ts`.
- Database access lives in `modules/<domain>/*.repository.ts`.
- Domain types live in `modules/<domain>/*.types.ts`.
- Shared helpers live in `lib/`.
- Prisma schema is `prisma/schema.prisma`.
- Initial SQL schema is `database/create-tables.sql`.

## Execution Rules

- Implement one task group at a time unless the user explicitly asks for all tasks in one pass.
- Keep code changes minimal and local to the task.
- Preserve existing API response contracts unless the task explicitly says otherwise.
- Keep route handlers focused on HTTP concerns: auth, parsing, Zod validation, status code, and response wrapper.
- Put validation in Zod schema files, not inline in route handlers.
- Put business decisions in service files.
- Put Prisma queries and transactions in repository files.
- Use `@/*` imports.
- Use `success(data)` or `success(data, 201)` for successful API responses.
- Use `failure(error)` in route handler catch blocks.
- Throw `AppError` for intentional HTTP errors.
- Use `requireUser(request)` for protected endpoints.
- For user-scoped resources, always use `user.userId` from JWT, not request body.
- For products, preserve soft delete behavior with `deletedAt: null` in active queries.
- For order creation, preserve transaction safety for stock decrement and total calculation.
- Do not read or expose `.env` contents.
- Do not edit `.next/`, `node_modules/`, generated build output, or secrets.
- Avoid broad refactors.
- When adding or changing a feature, update `AGENTS.md` if the change affects endpoints, commands, environment variables, architecture rules, auth/security behavior, database/Prisma setup, manual testing notes, or verification workflow.

## Prisma Rules

- If `prisma/schema.prisma` changes, update related SQL, migration, or setup instructions when needed.
- Run `npm run prisma:generate` after Prisma schema changes.
- Keep order, stock, and total changes transaction-safe.

## Subagent Review Triggers

- Use `.opencode/agents/subagent/api-implementer.md` for new or changed API endpoint implementation patterns when useful.
- Use `.opencode/agents/subagent/auth-security-reviewer.md` after implementation when changes touch JWT auth, protected routes, authorization, login, secrets, or user-scoped data access.
- Use `.opencode/agents/subagent/prisma-reviewer.md` after implementation when changes touch Prisma schema, seed data, SQL schema, repositories, transactions, stock decrement, or totals.
- Use `.opencode/agents/subagent/code-reviewer.md` after implementation for non-trivial code changes, architectural consistency, regressions, or maintainability risks.
- Use `.opencode/agents/subagent/test-reviewer.md` after implementation when changes touch API behavior, endpoint contracts, test coverage, or manual verification scenarios.
- Treat security findings as blockers when they identify leaked secrets, unsafe auth behavior, missing user scoping, or privilege issues.
- Treat Prisma findings as blockers when they identify transaction safety, stock consistency, schema mismatch, or migration/setup risks.
- Treat API/code review findings as blockers when they identify broken routes, response contract regressions, missing validation, or unsafe endpoint behavior.
- If a required subagent cannot run, report the blocker in the final response and do not claim that area was reviewed.

## Task Tracking

- Update the active task backlog when a task is completed or blocked.
- Change status markers only after implementation and verification for that task are done.
- If a task cannot be completed due to external services or unclear requirements, mark it `[!]` and document the blocker in the task file.
- If a feature addition changes project conventions or available endpoints, update `AGENTS.md` in the same task before marking it complete.

## Verification Baseline

- Run `npm run lint` after TypeScript/API edits when feasible.
- Run `npm run build` for build-sensitive changes when feasible.
- Run `npm run prisma:generate` after Prisma schema edits.
- For endpoint changes, run manual HTTP verification when the dev server and database are available.
- If verification cannot run because PostgreSQL, environment variables, or services are unavailable, report the exact blocker.

## Expected Final Response

- Write the final response and summary in Bahasa Indonesia.

1. Summary of implemented task groups.
2. Files changed.
3. API response contract impact.
4. Database or Prisma impact.
5. Verification commands and results.
6. `AGENTS.md` update status.
7. Remaining tasks or blockers.
