# SQL Injection and XSS Hardening Tasks

Source plan: `.opencode/docs/plan/sql-injection-xss-hardening-plan.md`

## 1. Tighten Zod String Validation

- [x] Update `modules/products/product.schema.ts` so product `name` uses `trim()`, `min(1)`, and `max(120)`.
- [x] Update `modules/products/product.schema.ts` so product `description` uses `trim()` and `max(500)` while preserving existing nullable/optional behavior.
- [x] Update `modules/products/product.schema.ts` so product `search` uses `trim()` and `max(120)` while remaining optional.
- [x] Update `modules/checkout/checkout.schema.ts` so shipping fields are trimmed and bounded: `shippingName` max 120, `shippingPhone` min 5 max 30, `shippingAddress` max 500, `shippingCity` max 120, and `shippingPostalCode` max 20.
- [x] Update `modules/inventory/inventory.schema.ts` so optional inventory `note` uses `trim()` and `max(500)`.
- [x] Update `modules/auth/auth.schema.ts` so `email` uses `trim()`, `toLowerCase()`, `email()`, and `max(254)`.
- [x] Update `modules/auth/auth.schema.ts` so `password` uses `min(6)` and `max(128)`.
- [x] Do not add HTML escaping/sanitizing before storage; keep plain text storage and rely on React output escaping as described by the plan.

## 2. Reduce Reflected User/Admin-Generated Text In Errors

- [x] Update insufficient-stock errors in `modules/checkout/checkout.repository.ts` to use a generic message such as `Insufficient stock for one or more products`.
- [x] Update insufficient-stock errors in `modules/orders/order.repository.ts` to use the same generic message.
- [x] Preserve order and checkout transaction safety for stock, totals, order items, inventory movements, and cart clearing while changing error text.

## 3. Review Response Error Shape

- [x] Review `lib/response.ts` to verify validation and app errors do not include raw request bodies, submitted sensitive values, or other unsafe reflected data.
- [x] Keep `ZodError` issues only if they describe schema paths/expected types and do not include submitted values.
- [x] Keep generic HTTP 500 behavior for unexpected errors.

## 4. Add Security Headers Defense-In-Depth

- [x] Evaluate whether security headers should be added in `next.config` or middleware with the smallest change that fits the current Next.js app.
- [x] Add non-CSP baseline headers if feasible: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Frame-Options: DENY`.
- [!] Evaluate a conservative `Content-Security-Policy` for compatibility with Next.js runtime; if it breaks local/build smoke tests, document CSP as a follow-up and keep non-CSP headers. Blocker: CSP requires production build/browser smoke validation and is left as follow-up to avoid breaking Next.js runtime.

## 5. Regression Tests

- [x] Add or update tests under `tests/integration/**` when integration DB setup is available.
- [x] Add schema unit tests if integration DB testing is not practical for the validation changes.
- [x] Cover product create rejection for `name` longer than 120 characters.
- [x] Cover product search rejection for query longer than 120 characters.
- [x] Cover checkout rejection for overly long shipping fields.
- [x] Cover inventory adjustment rejection for `note` longer than 500 characters.
- [x] Cover SQLi-like product search payload such as `' OR 1=1 --` returning a normal filtered response without SQL errors or unexpected all-record results.
- [x] Cover XSS-like product name such as `<img src=x onerror=alert(1)>` being stored/returned as text without introducing HTML rendering.
- [x] Cover insufficient-stock errors not including the raw product name.

## 6. Documentation And Project Workflow

- [x] Evaluate whether `AGENTS.md` needs an update because this plan may affect auth/security behavior, architecture/security-header guidance, manual testing notes, or verification workflow; update it if applicable.
- [x] After implementation, create or update an implementation note in `.opencode/docs/implement/` with summary, changed files, verification run, manual tests not run, risks, and follow-up.

## 7. Verification

- [x] Run `npm run lint`.
- [x] Run `npm run test`.
- [x] Run `npm run test:integration` if an integration database is configured.
- [x] If security headers or build-sensitive configuration changes are made, run `npm run build`.
- [!] Manually login as admin and verify creating a product with a long name returns HTTP 400. Blocker: manual dev server/browser HTTP session was not run in this implementation pass; covered by integration test.
- [!] Manually create a product with an HTML-like name and verify API returns it as a JSON string and UI displays it as text. Blocker: manual UI/browser session was not run; API behavior covered by integration test.
- [!] Manually search with a SQLi-like payload and verify there is no SQL error and no unexpected records. Blocker: manual HTTP session was not run; covered by integration test.
- [!] Manually login as customer, checkout with an overly long shipping address, and verify HTTP 400. Blocker: manual HTTP session was not run; covered by integration test.
- [!] Manually trigger insufficient stock and verify the response error is generic. Blocker: manual HTTP session was not run; covered by integration test.
- [!] Smoke test homepage `/`, admin products `/admin/products`, and customer dashboard `/customer` for unchanged rendering and flows. Blocker: manual browser session was not run; production build passed.
