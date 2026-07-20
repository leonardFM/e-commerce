# Backend Production Hardening Implementation

## Summary

Implementasi hardening backend Solutech Commerce mencakup:
- **Phase 1:** API Contract & Validation Fixes
- **Phase 2:** Auth & Abuse Protection Hardening
- **Phase 3:** Money Precision & Database Integrity
- **Phase 4:** Transaction & Concurrency Safety
- **Phase 5:** Product Soft Delete Consistency
- **Phase 6:** Test Coverage & CI (partial)
- **Phase 7:** Security Headers & Operational Hardening

## Changed Files

### Phase 1 — API Contract & Validation Fixes
- `app/api/products/route.ts` — GET menjadi public, tanpa `requireUser`
- `app/api/products/[id]/route.ts` — GET public, PATCH/DELETE tetap admin; pakai `parsePositiveInt`
- `app/api/cart/items/[productId]/route.ts` — pakai `parsePositiveInt` dari `lib/param`
- `app/api/orders/[id]/route.ts` — pakai `parsePositiveInt` dari `lib/param`
- `lib/param.ts` — baru: shared `parsePositiveInt` helper
- `lib/response.ts` — Zod error response disanitasi (hanya path, code, message)

### Phase 2 — Auth & Abuse Protection Hardening
- `lib/auth.ts` — JWT TTL 7d → 1h; validasi JWT_SECRET strength; bearer parser ketat
- `lib/request.ts` — `requireUser()` cek user ke database; tambah `getClientIp()`
- `app/api/auth/login/route.ts` — kirim IP ke service
- `app/api/auth/register/route.ts` — kirim IP ke service
- `modules/auth/auth.service.ts` — IP-aware rate limit, global throttle, register rate limit, generic duplicate message
- `modules/auth/auth.schema.ts` — password min 6 → 10 karakter
- `lib/rate-limit.ts` — (tidak diubah; reusable untuk global throttle)

### Phase 3 — Money Precision & Database Integrity
- `prisma/schema.prisma` — Float → Decimal @db.Decimal(12,2) untuk 5 field uang
- `database/create-tables.sql` — DOUBLE PRECISION → DECIMAL(12,2); tambah check constraints; tambah indexes
- `modules/products/product.repository.ts` — konversi Decimal ke number; update/delete hanya untuk `deletedAt: null`
- `modules/cart/cart.repository.ts` — konversi Decimal ke number
- `modules/checkout/checkout.repository.ts` — konversi Decimal ke number
- `modules/orders/order.repository.ts` — konversi Decimal ke number; toOrderRecord handle unknown

### Phase 4 — Transaction & Concurrency Safety
- `modules/cart/cart.repository.ts` — `addCartItem` atomic dalam transaction dengan validasi stock
- `modules/checkout/checkout.repository.ts` — SELECT FOR UPDATE, stockBefore/after dari DB setelah update
- `modules/cart/cart.repository.ts` — filter soft-deleted product dari cart read

### Phase 5 — Product Soft Delete Consistency
- `modules/products/product.repository.ts` — `updateProduct` dan `softDeleteProduct` hanya untuk `deletedAt: null`

### Phase 6 — Test Coverage & CI
- `.github/workflows/ci.yml` — baru: GitHub Actions CI
- `tests/integration/auth.test.ts` — RBAC matrix, validasi path param, 401/403 matrix

### Phase 7 — Security Headers & Operational Hardening
- `next.config.mjs` — HSTS production, Permissions-Policy
- `lib/redis.ts` — error event listener dengan sanitized logging
- `prisma/seed.js` — guard production dengan SEED_CONFIRM

## Verification

- `npm run lint`: passed (3 existing warnings dari coverage/*)
- `npm run build`: passed
- `npm run prisma:generate`: passed

## Manual Tests Not Run

- Integration tests via `npm run test:integration` (membutuhkan PostgreSQL test database)
- Manual API smoke test via HTTP client
- Manual UI smoke test untuk dashboard admin/customer

## API / Database / Prisma Impact

- **API contract:** `GET /api/products` dan `GET /api/products/:id` sekarang public (tanpa auth)
- **Database:** Money type dari `Float` (DOUBLE PRECISION) ke `Decimal(12,2)`. Migration diperlukan untuk data existing.
- **Database:** Check constraints dan indexes baru ditambahkan via SQL.
- **Prisma schema:** 5 field diubah dari `Float` ke `Decimal`.
- **Response:** Decimal dikonversi ke `number` di repository mappers.

## AGENTS.md Updates

- Environment: JWT_SECRET minimal 32 karakter
- Auth: JWT TTL 1jam, password min 10, validation error sanitasi, duplicate register generic, requireUser DB check, rate limit IP-aware, register rate limit
- Endpoints: product GET public
- Headers: HSTS production, Permissions-Policy

## Risks And Follow-Up

1. Money type migration dari Float ke Decimal membutuhkan manual migration/db push untuk data existing.
2. Integration tests belum diverifikasi karena PostgreSQL test database tidak tersedia.
3. Token TTL 1 jam bisa memengaruhi UX jika dashboard customer/admin tidak otomatis refresh token.
4. Check constraints di SQL mungkin gagal jika data existing melanggar invariant.
5. Konversi Decimal ke number di repository bisa kehilangan presisi untuk nilai uang sangat kecil.
6. Session/revocation mechanism belum diimplementasi; token valid 1 jam tanpa revoke.
