# Security Hardening Plan

## Goal

Memperbaiki 22 temuan keamanan dari audit: 1 critical, 5 high, 5 medium, 8 low, 3 informational.

## Current Assessment

Fondasi keamanan solid (Zod validation, RBAC, rate limit pattern, transaction safety, sanitize-html), namun terdapat bug dan celah yang perlu diperbaiki sebelum production.

## Scope

1. Fix register rate limit yang tidak berfungsi (critical)
2. Harden JWT & credential security (high)
3. Order/payment state machine hardening (medium)
4. Rate limiting checkout & request body size limit (high/medium)
5. CSP hardening (medium)
6. Low priority fixes

---

## Fase 1: Register Rate Limit Fix (Critical)

### Problem

`modules/auth/auth.service.ts:registerCustomer()` memanggil `assertFailedLoginRateLimit()` tapi tidak pernah memanggil `incrementFailedLoginRateLimit()` saat registrasi gagal. Counter Redis tetap 0 sehingga limit 3/jam per IP tidak aktif.

### Implementation

1. Tambah `incrementFailedLoginRateLimit` di catch block duplicate email (sebelum throw)
2. Increment juga di catch `P2002` (race condition duplicate)
3. Reset counter di path sukses (registrasi berhasil)

### Files

- `modules/auth/auth.service.ts`

### Verification

- [ ] Register dari IP yang sama > 3 kali dalam 1 jam mendapat 429
- [ ] Register dari IP berbeda tetap bisa
- [ ] `npm run lint`, `npm run build`, `npm run test`

---

## Fase 2: Harden JWT & Credential Security (High)

### H-01: .env.example JWT placeholder

Ganti `JWT_SECRET` di `.env.example` ke `"change-me-in-production"` agar guard di `lib/auth.ts` benar-benar aktif.

**File:** `.env.example`

### H-02: Hapus .env dari tracked files

- `git rm --cached .env`
- Pastikan `.gitignore` sudah include `.env`
- Rotate JWT secret & DB password yang terekspos

### H-04: Hardcoded JWT secret di CI & vitest

**Files:** `.github/workflows/ci.yml`, `vitest.config.ts`
- CI: ganti inline value ke placeholder / GitHub Actions secret reference
- vitest: ganti dengan env var yang di-set di globalSetup

---

## Fase 3: Order/Payment State Machine (Medium)

### M-01: updateOrderPaymentService side-effect status change

Validasi: hanya update status ke `PAID` jika current status memungkinkan (PENDING). Panggil `validateStatusTransition()` sebelum side-effect status change.

**File:** `modules/orders/order.service.ts`

---

## Fase 4: Rate Limiting & Body Size (High/Medium)

### H-05: Rate limit POST /api/checkout

Tambah user-scoped rate limit (10 checkout/jam/user) dengan fail-open jika Redis tidak tersedia.

**File:** `app/api/checkout/route.ts`

---

## Fase 5: CSP Hardening (Medium)

### M-02/M-03: Perkuat Content-Security-Policy

**File:** `next.config.mjs`
- Tambah `"object-src 'none'"`
- Tambah `"worker-src 'self'"`

---

## Fase 6: Low Priority

- L-01: `password123` di seed — evaluasi
- L-02: Credential di Postman/OpenAPI — evaluasi
- L-03: DB superuser di `.env.example` — dokumentasi
- L-07: OpenAPI publik — evaluasi
