# Transaction Error Query Cache Logging Implementation

Source task: `.opencode/docs/task/transaction-error-query-cache-logging.md`
Source plan: `.opencode/docs/plan/transaction-error-query-cache-logging-plan.md`

## Summary

- Added performance timing helpers in `lib/performance.ts`.
- Added expected API error logging for `ZodError` and `AppError` while preserving response contracts.
- Added transaction duration/failure logs for checkout, order, and inventory flows.
- Tightened legacy order stock transaction auditing by creating `InventoryMovement` rows in the same transaction.
- Added Prisma query performance logging via Prisma client extension with slow query threshold support, including failed query logs.
- Added Redis cache operation timing, hit/miss, slow-operation logs, and safe hashed key/prefix fields.
- Replaced product cache logs that exposed raw cache keys with hashed key fields.
- Added focused tests for logger file redaction, performance helpers, and AppError response preservation.
- Updated environment and agent docs for slow query/cache thresholds and safe performance logging rules.

## Changed Files

- `.env.example`
- `AGENTS.md`
- `lib/performance.ts`
- `lib/response.ts`
- `lib/prisma.ts`
- `lib/cache.ts`
- `modules/checkout/checkout.service.ts`
- `modules/orders/order.service.ts`
- `modules/inventory/inventory.service.ts`
- `modules/products/product.service.ts`
- `modules/orders/order.repository.ts`
- `tests/logger.test.ts`
- `tests/performance.test.ts`
- `tests/response.test.ts`
- `.opencode/docs/task/transaction-error-query-cache-logging.md`
- `.opencode/docs/implement/transaction-error-query-cache-logging.md`

## Verification Run

- `npm run lint`: passed with existing warnings in generated coverage files about unused eslint-disable directives.
- `npm run build`: passed.
- `npm run test -- tests/logger.test.ts tests/performance.test.ts tests/response.test.ts`: passed.
- `npm run test:integration`: passed, 6 files and 21 tests.

## Manual Tests Not Run

- Manual `npm run dev` file logging smoke test was not run.
- API flows were not manually triggered against a running dev server/database in this pass.
- Prisma query performance logs were exercised by integration tests, but manual inspection in `logs/app.jsonl` from a dev server was not performed.

## Risks And Follow-Up

- Query/cache debug logs can be noisy; use `LOG_LEVEL=info` in production unless troubleshooting.
- Slow query/cache thresholds may need tuning after observing real traffic.
- Prisma query extension adds small overhead to every Prisma query.
- File logging still needs external rotation if used outside local/demo environments.
- Future improvement: add request/correlation id for tracing logs across routes, services, queries, and cache operations.
