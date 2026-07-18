# Pino Structured Logging Tasks

Source plan: `.opencode/docs/plan/pino-structured-logging-plan.md`

## Dependency and Logger Foundation

- [x] Install `pino` with `npm install pino` and commit resulting `package.json` and `package-lock.json` changes.
- [x] Add `lib/logger.ts` exporting a singleton `logger`.
- [x] Configure logger level from optional `LOG_LEVEL`, defaulting to `debug` in development and `info` otherwise.
- [x] Configure Pino redaction for `password`, `passwordHash`, `token`, `authorization`, `headers.authorization`, `input.password`, `*.password`, and `*.token`.
- [x] Ensure application code uses `logger` from `lib/logger.ts` instead of direct `console.log` for app logs.

## Error Response and Route Context

- [x] Update `lib/response.ts` so `failure(error, context?)` accepts optional `{ feature, method, path, userId }` context.
- [x] Preserve `ZodError` HTTP 400 behavior with issues in the response.
- [x] Preserve `AppError` status and message behavior.
- [x] Log non-`AppError` `Error` instances server-side with `logger.error` and return generic `{ error: 'Internal Server Error' }` with status 500.
- [x] Log unknown errors server-side and return generic 500 responses.
- [x] Add failure context in `app/api/auth/login/route.ts`.
- [x] Add failure context in `app/api/products/route.ts` and preserve active product filtering with `deletedAt: null` where applicable.
- [x] Add failure context in `app/api/products/[id]/route.ts` and preserve product soft delete behavior.
- [x] Add failure context in `app/api/cart/route.ts`, using `requireUser(request)` and scoping by `user.userId` for protected customer data.
- [x] Add failure context in `app/api/cart/items/route.ts`, using `requireUser(request)` and `user.userId` scoping.
- [x] Add failure context in `app/api/cart/items/[productId]/route.ts`, using `requireUser(request)` and `user.userId` scoping.
- [x] Add failure context in `app/api/checkout/route.ts`, using `requireUser(request)`, `user.userId` scoping, and preserving transaction safety for stock, totals, order items, inventory movement, and cart clearing.
- [x] Add failure context in `app/api/orders/route.ts`, using `requireUser(request)`, `user.userId` scoping, and preserving transaction safety for order creation if applicable.
- [x] Add failure context in `app/api/orders/[id]/route.ts`, using `requireUser(request)` and `user.userId` scoping.
- [x] Add failure context in `app/api/admin/orders/route.ts`.
- [x] Add failure context in `app/api/admin/orders/[id]/status/route.ts`.
- [x] Add failure context in `app/api/admin/orders/[id]/payment/route.ts`.
- [x] Add failure context in `app/api/inventory/movements/route.ts`.
- [x] Add failure context in `app/api/inventory/adjustments/route.ts`.

## Business Event Logs

- [x] Add auth logs in `modules/auth/auth.service.ts`: `auth_login_succeeded`, `auth_login_failed`, and `auth_login_rate_limited` without logging passwords or JWT tokens.
- [x] Ensure auth logs may include normalized email, `userId`, and role only where available.
- [x] Add product logs in `modules/products/product.service.ts`: `product_created`, `product_updated`, `product_deleted`, plus debug-level `product_cache_hit` and `product_cache_miss`.
- [x] Add cart logs in `modules/cart/cart.service.ts`: `cart_item_added`, `cart_item_updated`, `cart_item_removed`, `cart_cleared`, and warnings for missing products or quantity exceeding stock.
- [x] Add checkout logs in `modules/checkout/checkout.service.ts`: `checkout_started`, `checkout_lock_conflict`, `checkout_payment_failed`, `checkout_order_created`, and `checkout_completed` while preserving payment failure behavior with no order, stock decrement, or cart clearing.
- [x] Add order logs in `modules/orders/order.service.ts`: `order_created`, `order_status_updated`, `order_payment_updated`, and warnings for invalid order transitions.
- [x] Add inventory log in `modules/inventory/inventory.service.ts`: `inventory_adjustment_created`, preserving stock non-negative validation and `InventoryMovement` creation.

## Redis, Cache, Lock, and Rate Limit Infra Logs

- [x] Add fail-open logging in `lib/cache.ts` for `cache_get_failed`, `cache_set_failed`, `cache_delete_failed`, and `cache_delete_by_prefix_failed` without changing cache behavior.
- [x] Add fail-open logging in `lib/lock.ts` for `redis_lock_acquire_failed` and `redis_lock_release_failed` without changing lock behavior.
- [x] Add fail-open logging in `lib/rate-limit.ts` for `rate_limit_check_failed`, `rate_limit_increment_failed`, and `rate_limit_reset_failed` without changing rate-limit behavior.

## Documentation and Project Workflow

- [x] Add `LOG_LEVEL=info` to `.env.example` if the file exists.
- [x] Update `AGENTS.md` with the optional `LOG_LEVEL` environment variable and logging workflow rules: use `logger` from `lib/logger.ts`, avoid direct `console.log` in app code, and never log password, token, authorization header, secret, or sensitive data.
- [x] After implementation, create or update an implementation note in `.opencode/docs/implement/` with summary, changed files, verification run, manual tests not run, risks, and follow-up.

## Verification

- [x] Run `npm run lint`.
- [x] Run `npm run build` if possible.
- [ ] Manually smoke test login for admin and customer.
- [ ] Manually trigger failed login and confirm no password/token is logged.
- [ ] Manually smoke test product list and detail endpoints.
- [ ] Manually smoke test add, update, and remove cart item endpoints.
- [ ] Manually smoke test successful checkout and confirm stock/order/cart consistency.
- [ ] Manually smoke test failed checkout payment and confirm no order is created, stock is unchanged, and cart is retained.
- [ ] Manually smoke test admin order status and payment updates.
- [ ] Manually smoke test admin inventory adjustment.
- [ ] Verify application still runs with `REDIS_URL` unset or empty and fail-open Redis/cache/rate-limit/lock paths log appropriately.

## Verification Notes

- Manual verification blocker: dev server, PostgreSQL test data, and HTTP smoke-test session were not started in this implementation pass. Automated `npm run lint` and `npm run build` were run successfully.
