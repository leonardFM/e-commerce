# SQL Injection and XSS Hardening Implementation

Source task: `.opencode/docs/task/sql-injection-xss-hardening.md`
Source plan: `.opencode/docs/plan/sql-injection-xss-hardening-plan.md`

## Summary

- Tightened Zod validation for product, checkout, inventory, and auth string inputs with `trim()` and domain-specific max lengths.
- Replaced insufficient-stock API errors that included product names with a generic conflict message.
- Reviewed `lib/response.ts`; no code change needed because validation logs include issue count only, app errors log intentional messages only, and unexpected errors return generic HTTP 500.
- Added baseline non-CSP security headers in `next.config.mjs`.
- Added integration regression tests for oversized strings, SQLi-like product search payloads, XSS-like product names as plain text, and generic insufficient-stock errors.
- Updated `AGENTS.md` with security hardening conventions and header behavior.

## Files Changed

- `modules/products/product.schema.ts`
- `modules/checkout/checkout.schema.ts`
- `modules/inventory/inventory.schema.ts`
- `modules/auth/auth.schema.ts`
- `modules/checkout/checkout.repository.ts`
- `modules/orders/order.repository.ts`
- `next.config.mjs`
- `tests/integration/products.test.ts`
- `tests/integration/checkout.test.ts`
- `tests/integration/inventory.test.ts`
- `AGENTS.md`
- `.opencode/docs/task/sql-injection-xss-hardening.md`

## Verification Run

- `npm run lint` passed with existing warnings in `coverage/*.js` about unused eslint-disable directives.
- `npm run test` passed before the additional legacy order regression test: 9 test files, 26 tests.
- `npm run test:integration` passed after the additional legacy order regression test: 6 test files, 23 tests.
- `npm run build` passed with Next.js production build.

## Manual Tests Not Run

- Manual admin login and long product-name HTTP 400 check.
- Manual HTML-like product UI rendering check.
- Manual SQLi-like search check via HTTP client.
- Manual customer checkout with oversized shipping address.
- Manual homepage/admin/customer UI smoke tests.

## Risks And Follow-Up

- `trim()` changes persisted values by removing leading/trailing whitespace; this is intentional.
- CSP was not enabled to avoid breaking Next.js runtime without browser/build smoke validation. Revisit CSP separately after verifying production build and UI behavior.
- Database column limits were not changed; future Prisma migration can align database constraints with Zod limits if desired.
