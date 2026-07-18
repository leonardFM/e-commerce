# Transaction Error Query Cache Logging Tasks

Source plan: `.opencode/docs/plan/transaction-error-query-cache-logging-plan.md`

## Performance Helpers And Environment

- [x] Add `lib/performance.ts` with `startTimer()` and `elapsedMs(start)` based on `process.hrtime.bigint()`.
- [x] Update `.env.example` with `SLOW_QUERY_THRESHOLD_MS="100"` and `SLOW_CACHE_THRESHOLD_MS="50"`.
- [x] Ensure defaults remain `100` ms for slow Prisma queries and `50` ms for slow cache operations when env values are unset.

## Centralized API Error Logging

- [x] Update `lib/response.ts` to log `api_validation_error` for `ZodError` without changing the `400 { error: 'Validation error', issues }` response.
- [x] Update `lib/response.ts` to log `api_app_error` for `AppError` without changing status code or `{ error: error.message }` response.
- [x] Preserve existing unexpected error logs `unhandled_api_error` and `unknown_api_error` and generic `500 { error: 'Internal Server Error' }` responses.
- [x] Keep error log context limited to safe route context such as `feature`, `method`, `path`, `userId`, and `statusCode`; do not log full request body or sensitive values.
- [x] Use `debug` for expected `404` app errors and `warn` for other planned app-error statuses from the plan.

## Business Transaction Logs

- [x] Update `modules/checkout/checkout.service.ts` to add `durationMs` to `checkout_completed` and add safe `checkout_failed` logs after checkout start without changing transaction/payment behavior.
- [x] Preserve existing checkout logs including `checkout_started`, `checkout_order_created`, `checkout_payment_failed`, and `checkout_lock_conflict`; avoid excessive duplicate failure logging.
- [x] Update `modules/orders/order.service.ts` so `order_created`, `order_status_updated`, and `order_payment_updated` include `durationMs`.
- [x] Add `order_create_failed` logging in `modules/orders/order.service.ts` without changing order transaction safety for stock, totals, and order items.
- [x] Update `modules/inventory/inventory.service.ts` so `inventory_adjustment_created` includes `durationMs`.
- [x] Add `inventory_adjustment_failed` logging in `modules/inventory/inventory.service.ts` without changing inventory movement behavior or negative-stock protections.
- [x] Keep transaction log fields limited to the safe fields listed in the plan: IDs, totals/statuses, quantity changes, payment method/status, and `durationMs`.

## Prisma Query Performance Logging

- [x] Update `lib/prisma.ts` to measure Prisma query duration using middleware or extension while preserving the singleton global Prisma pattern.
- [x] Log normal query performance through Pino at `debug` with event `prisma_query_performance` and fields `model`, `action`, and `durationMs`.
- [x] Log slow queries through Pino at `warn` with event `prisma_slow_query` and fields `model`, `action`, `durationMs`, and `thresholdMs`.
- [x] Use `SLOW_QUERY_THRESHOLD_MS` with default `100`.
- [x] Remove or avoid Prisma native query stdout logging if needed to prevent duplicate logs and bypassing Pino/file destination.
- [x] Do not log raw SQL, Prisma params, row data, or sensitive values.

## Redis Cache Performance Logging

- [x] Update `lib/cache.ts` to time `getJsonCache`, `setJsonCache`, `deleteCacheKey`, and `deleteCacheByPrefix`.
- [x] Add normal `debug` logs for `cache_get`, `cache_set`, `cache_delete`, and `cache_delete_by_prefix`.
- [x] Add `warn` slow-operation logs with event `cache_slow_operation` using `SLOW_CACHE_THRESHOLD_MS` defaulting to `50`.
- [x] Include safe fields where available: `operation`, `durationMs`, `thresholdMs`, `hit`, `keyHash`, `prefixHash`, `ttlSeconds`, and `deletedCount`.
- [x] Preserve existing Redis/cache fail-open warning logs and behavior.
- [x] Do not log raw cache keys or prefixes.

## Product Cache Log Cleanup

- [x] Update `modules/products/product.service.ts` so product cache hit/miss logs no longer include raw `cacheKey`.
- [x] Either replace `cacheKey` with `keyHash: logHash(cacheKey)` or remove product-level cache hit/miss logs in favor of generic `lib/cache.ts` performance logs.
- [x] Preserve product query behavior, including active-product filters with `deletedAt: null`.

## Tests

- [x] Add or update tests verifying `failure(AppError)` preserves response status/message and does not throw.
- [x] Keep logger redaction/file logging tests passing.
- [x] Add or update cache performance logging tests to ensure raw keys are not exposed.
- [x] Add a focused test for `lib/performance.ts` confirming `elapsedMs()` returns a numeric duration.
- [x] If Prisma query performance logging is not practical to unit test without a database, document verification via integration/manual checks in the implementation note.

## Documentation Workflow

- [x] Update `AGENTS.md` for new env vars `SLOW_QUERY_THRESHOLD_MS` and `SLOW_CACHE_THRESHOLD_MS`.
- [x] Update `AGENTS.md` with logging workflow rules that query performance logs must use Pino structured logs and must not log raw SQL params or raw cache keys.
- [x] After implementation, create `.opencode/docs/implement/transaction-error-query-cache-logging.md` with summary, changed files, verification run, manual tests not run, and risks/follow-up.

## Verification

- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Run `npm run test -- tests/logger.test.ts`.
- [x] Run any new or updated focused test files for response, cache, or performance helpers.
- [x] Run `npm run test:integration`.
- [ ] Manually run file logging mode: `LOG_DESTINATION=file LOG_FILE_PATH=logs/app.jsonl LOG_LEVEL=debug npm run dev`.
- [ ] Trigger failed login and confirm `api_app_error` or auth failure logs appear without sensitive values.
- [ ] Trigger product list/detail and verify cache performance and Prisma query performance logs include `durationMs` and no raw cache keys or SQL params.
- [ ] Trigger cart add/update/remove and verify query performance logs do not change API behavior.
- [ ] Trigger checkout success and verify `checkout_completed`, `order_created`, query performance, and cache invalidation logs include safe fields and `durationMs`.
- [ ] Trigger failed checkout payment and verify `checkout_payment_failed` and `checkout_failed` are logged without creating order, reducing stock, or clearing cart.
- [ ] Trigger admin inventory adjustment and verify `inventory_adjustment_created` includes `durationMs`.
- [ ] Validate `logs/app.jsonl` is valid JSON Lines and contains no password, token, authorization header, raw email, raw cache key, payment reference, shipping phone, shipping address, or raw SQL params.

## Verification Notes

- Automated verification completed: `npm run lint` passed with existing coverage warnings, `npm run build` passed, and focused tests passed via `npm run test -- tests/logger.test.ts tests/performance.test.ts tests/response.test.ts`.
- Prisma query performance logging and transaction behavior were additionally verified through `npm run test:integration` against the configured test database.
- Manual file logging/API flow checks were not run because no long-running dev server and database HTTP smoke-test session was started.
