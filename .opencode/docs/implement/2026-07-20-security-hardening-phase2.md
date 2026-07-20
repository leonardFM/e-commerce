# Security Hardening — Phase 2

## Ringkasan

Perbaikan 22 temuan keamanan dari audit, diorganisir dalam 6 fase.

## Perubahan

### Fase 1: Register Rate Limit Fix (Critical)

**File:** `modules/auth/auth.service.ts`
- Tambah `incrementFailedLoginRateLimit()` sebelum throw pada duplicate email (line 100)
- Tambah `incrementFailedLoginRateLimit()` sebelum throw pada Prisma P2002 race condition (line 115)
- Tambah `resetFailedLoginRateLimit(registerKey)` pada path sukses (line 111)

### Fase 2: Harden Credential Security (High)

**File:** `.env.example`
- Ganti `JWT_SECRET` dari `solutech-super-secret-key-32-characters-long` ke `change-me-in-production` agar guard di `lib/auth.ts:10` aktif
- Tambah komentar: recommended dedicated DB user, LOG_DESTINATION advice, SEED_PASSWORD

**File:** `.github/workflows/ci.yml`
- Ganti hardcoded `JWT_SECRET` ke `${{ secrets.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long-for-ci' }}` di langkah test:integration dan build

**File:** `vitest.config.ts`
- Ganti `??` hardcoded fallback `'test-jwt-secret-that-is-at-least-32-char'` ke `'test-secret-that-is-at-least-32-char-long'` (minor normalization)

### Fase 3: Order/Payment State Machine (Medium)

**File:** `modules/orders/order.service.ts`
- Di `updateOrderPaymentService()`: tambah `validateStatusTransition(order.status, 'PAID')` sebelum update agar order status tidak regress (misal PROCESSING → PAID)

**File:** `modules/orders/order.repository.ts`
- `updateOrderPayment()`: hanya auto-set status ke PAID jika current status adalah PENDING, bukan sembarang status

### Fase 4: Rate Limit Checkout (High)

**File:** `app/api/checkout/route.ts`
- Tambah rate limit 10 checkout/jam per user+IP menggunakan Redis
- Fail-open jika Redis tidak tersedia

### Fase 5: CSP Hardening (Medium)

**File:** `next.config.mjs`
- Tambah `"object-src 'none'"`
- Tambah `"worker-src 'self'"`
- Reorder directives (upgrade-insecure-requests dipindah ke akhir)

### Fase 6: Low Priority

**File:** `prisma/seed.js`
- Dukung `SEED_PASSWORD` env var; fallback ke `password123` untuk backward compatibility
- Hapus log password ke console

## Verifikasi

- [x] `npm run lint` — 0 error
- [x] `npm run build` — build sukses
- [ ] `npm run test` — unit test
- [ ] `npm run test:integration` — jika test database tersedia
- [ ] Manual: register rate limit
- [ ] Manual: checkout rate limit
- [ ] Manual: order state machine
- [ ] Manual: payment regression

## Risiko/Follow-up

- localStorage JWT masih belum migrasi ke HttpOnly cookie (perubahan besar)
- `script-src 'unsafe-inline'` masih diperlukan oleh Next.js inline scripts
- Token revocation mechanism belum ada
