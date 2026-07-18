# Redis Integration All Phases Implementation

Source task: `.opencode/docs/task/redis-integration.md`
Source plan: `.opencode/docs/plan/redis-integration-plan.md`

## Summary

Implemented Redis integration across all planned phases:

- Redis client/configuration foundation.
- Short-TTL product list/detail cache.
- Short-TTL homepage featured products cache.
- Cache invalidation after product mutations, checkout stock changes, and inventory adjustments.
- Redis-backed failed login rate limit.
- Redis checkout lock per authenticated user.

## Files Changed

- `package.json`
- `package-lock.json`
- `.env.example`
- `AGENTS.md`
- `app/page.tsx`
- `lib/cache.ts`
- `lib/lock.ts`
- `lib/rate-limit.ts`
- `lib/redis.ts`
- `modules/auth/auth.service.ts`
- `modules/checkout/checkout.repository.ts`
- `modules/checkout/checkout.service.ts`
- `modules/inventory/inventory.service.ts`
- `modules/products/product.cache.ts`
- `modules/products/product.repository.ts`
- `modules/products/product.service.ts`
- `.opencode/docs/task/redis-integration.md`

## API Behavior Notes

- `GET /api/products` and `GET /api/products/:id` keep the same response shape and now use Redis cache when `REDIS_URL` is configured.
- `POST /api/auth/login` keeps the same success response and generic invalid credential failure, but repeated failed attempts can now return HTTP 429.
- `POST /api/checkout` keeps the same success response shape, but concurrent checkout for the same user can now return HTTP 409 while a Redis lock exists.
- Redis is fail-open for cache/rate-limit/lock helpers when `REDIS_URL` is missing or Redis is unavailable, except an already acquired checkout lock conflict returns 409.

## Database And Prisma Impact

- No Prisma schema changes.
- PostgreSQL remains the source of truth for products, stock, cart, orders, and inventory movements.
- Checkout transaction safety remains in the repository transaction.

## Verification Run

- `npm run lint` completed with 0 errors and 3 existing warnings in `coverage/*.js` for unused eslint-disable directives.
- `npm run test:integration -- tests/integration/products.test.ts tests/integration/auth.test.ts tests/integration/checkout.test.ts` completed successfully. Vitest ran all integration files: 6 files passed, 21 tests passed.
- `npm run build` completed successfully.

## Review Follow-up Applied

- Normalized login rate-limit email key with `trim().toLowerCase()` and used normalized email for user lookup.
- Added explicit product cache serialization/deserialization mappers so cached `Date` fields are restored as `Date` values in service/domain results.
- Updated generic cache helper to treat falsy cached values as valid hits when they are not `null`.
- Added PostgreSQL transaction-level advisory lock per checkout user with `pg_advisory_xact_lock` so duplicate same-user checkout is not dependent only on Redis lock.
- Kept Redis lock as best-effort request contention protection and PostgreSQL transaction as source of truth.
- Added cache invalidation after legacy `createOrderService` stock decrement path.

## Manual Tests Not Run

- Redis Docker service connectivity not manually verified yet.
- Product cache hit/miss/invalidation not manually verified with HTTP requests yet.
- Failed login 429 behavior not manually verified yet.
- Double checkout lock behavior not manually verified yet.

## Risks And Follow-up

- Cache invalidation currently deletes all `products:list:` keys by prefix; this is simple and safe for correctness but may be inefficient if key volume grows.
- Login rate limit uses normalized email as the key, not client IP.
- Token blacklist/session revocation remains deferred until logout/session management is added.
