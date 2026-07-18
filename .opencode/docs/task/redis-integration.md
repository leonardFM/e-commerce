# Redis Integration Tasks

Source plan: `.opencode/docs/plan/redis-integration-plan.md`

## Phase 1: Redis Client And Configuration

- [x] Add a Redis client dependency such as `ioredis` or `redis`.
- [x] Add `REDIS_URL` to `.env.example`.
- [x] Create `lib/redis.ts` as a singleton Redis client that does not crash tests or environments where Redis is not configured unless explicitly required.
- [x] Create minimal JSON cache helpers in `lib/cache.ts` if needed for repeated get/set/delete/prefix invalidation behavior.
- [x] Keep PostgreSQL as the source of truth for products, stock, cart, order, and inventory movement.

## Phase 2: Product And Homepage Cache

- [x] Add short-TTL cache for `GET /api/products` in `modules/products/product.service.ts` using a key shaped like `products:list:{hashQuery}`.
- [x] Preserve active product soft-delete filtering with `deletedAt: null` in product list behavior.
- [x] Add short-TTL cache for `GET /api/products/:id` in `modules/products/product.service.ts` using a key shaped like `products:detail:{productId}`.
- [x] Preserve route responsibilities in `app/api/products/route.ts` and `app/api/products/[id]/route.ts` for HTTP parsing, validation, status codes, and response wrappers only.
- [x] Add short-TTL cache for featured homepage products in `app/page.tsx` or extract the query to a small service if needed, using `homepage:featured-products`.

## Phase 3: Product Cache Invalidation

- [x] Invalidate product caches after `createProductService` succeeds.
- [x] Invalidate product caches after `updateProductService` succeeds.
- [x] Invalidate product caches after `deleteProductService` succeeds.
- [x] Invalidate product caches after successful checkout when stock changes, while preserving transaction safety for stock, totals, order items, inventory movement, and cart clearing.
- [x] Invalidate product caches after successful inventory adjustment when stock changes.
- [x] Ensure minimal invalidation deletes `homepage:featured-products`, the related `products:detail:{productId}` key, and all `products:list:` prefixed keys.

## Phase 4: Login Rate Limit

- [x] Add a Redis-backed rate limit helper in `lib/`.
- [x] Apply login rate limiting to `POST /api/auth/login` through `app/api/auth/login/route.ts` and/or `modules/auth/auth.service.ts` without moving route-only concerns into service logic.
- [x] Use a key shaped like `rate-limit:login:{emailOrIp}`.
- [x] Enforce an initial policy of maximum 5 failed login attempts per 10 minutes.
- [x] Increment the counter only on failed login attempts.
- [x] Reset/delete the counter after successful login.
- [x] Return HTTP 429 when the login rate limit is reached.

## Phase 5: Checkout Lock Or Idempotency

- [x] Add a short Redis lock per authenticated user for `POST /api/checkout` using a key shaped like `checkout:lock:user:{userId}`.
- [x] Ensure the protected checkout endpoint continues to call `requireUser(request)` and scopes work by `user.userId`.
- [x] Return HTTP 409 or 429 when checkout for the same user is already being processed.
- [x] Release the checkout lock in `finally`.
- [x] Preserve existing PostgreSQL transaction safety for stock validation/decrement, totals, order items, inventory movement, and cart clearing.

## Documentation And Follow-up

- [x] Update `AGENTS.md` because Redis implementation changes environment variables, local setup, and verification workflow.
- [x] After implementation, create or update a note in `.opencode/docs/implement/` summarizing changes, files changed, verification run, manual tests not run, and risks/follow-up.
- [x] Defer token blacklist/session revocation until logout or session management is added.
- [x] Do not move primary cart, orders, inventory movement, or stock source of truth to Redis.

## Verification

- [x] Run `npm run lint` after TypeScript changes.
- [x] Run `npm run build` if changes are build-sensitive.
- [x] Run `npm run test` or at least integration tests related to product/auth/checkout when Redis affects those flows.
- [ ] Manually start local services with `docker compose up -d db adminer redis redisinsight`.
- [ ] Manually verify admin/customer login still succeeds.
- [ ] Manually verify `GET /api/products` returns correct data.
- [ ] Manually verify create/update/delete product invalidates relevant cache.
- [ ] Manually verify homepage still displays featured products.
- [ ] Manually verify repeated failed login attempts trigger rate limiting.
- [ ] Manually verify double checkout creates one order and does not decrement stock twice.
