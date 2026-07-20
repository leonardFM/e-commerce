# Critical Security Fixes Plan

## Goal

Memperbaiki 7 critical security issues yang teridentifikasi dalam audit backend. Fokus pada kerentanan yang memungkinkan abuse, inkonsistensi data, atau bypass keamanan.

## Current Assessment

Backend memiliki fondasi keamanan yang solid (Zod validation, RBAC, rate limit pattern, transaction safety), namun terdapat bug dan celah signifikan yang perlu diperbaiki sebelum production.

## Scope

1. Fix register rate limit yang tidak berfungsi
2. Konsistensi JWT TTL (sliding session)
3. Race condition cart item (FOR UPDATE)
4. State machine order status
5. Global rate limit reset on success
6. Validasi payment status regression
7. Request body size limit

## Out Of Scope

- Email verification / forgot password flow (medium)
- General rate limiting non-auth endpoint (medium)
- Token revocation mechanism (medium)
- CSP hardening (medium)
- Cart expiration / cleanup (medium)

---

## Phase 1: Register Rate Limit Fix (P1)

### Problem

`modules/auth/auth.service.ts` memanggil `assertFailedLoginRateLimit` untuk register, tapi **tidak pernah** memanggil `incrementFailedLoginRateLimit` saat registrasi gagal. Counter Redis tidak pernah dibuat sehingga limit 3/jam per IP tidak aktif. Attacker bisa register tanpa batas dari IP yang sama.

### Implementation

1. **`modules/auth/auth.service.ts`** — di `registerCustomer()`, import `incrementFailedLoginRateLimit` dari `@/lib/rate-limit`.
2. Setelah validasi gagal (duplicate email), sebelum `throw`, increment counter untuk register key.
3. Increment juga di catch block Prisma `P2002` (race condition duplicate).

### Files Affected

- `modules/auth/auth.service.ts`

### Verification

- [ ] Register dari IP yang sama > 3 kali dalam 1 jam mendapat 429
- [ ] Register dari IP berbeda tetap bisa
- [ ] `npm run lint`, `npm run build`, `npm run test`

---

## Phase 2: JWT TTL Consistency (P2)

### Problem

`lib/auth.ts:25` — `setExpirationTime('1m')`. AGENTS.md menyebut 10 menit. Dengan 1 menit, sliding session trigger di setiap request (sisa < 2 menit), menghasilkan token baru terus-menerus.

### Implementation

1. **`lib/auth.ts`** — ubah `'1m'` menjadi `'10m'`.

### Files Affected

- `lib/auth.ts`

### Verification

- [ ] Login, dapat token, akses endpoint — response tanpa token baru (karena TTL > 2 menit)
- [ ] Tunggu 8+ menit — akses endpoint mendapat token baru di response
- [ ] `npm run lint`, `npm run build`, `npm run test`

---

## Phase 3: Cart Item Race Condition — FOR UPDATE (P3)

### Problem

`modules/cart/cart.repository.ts:85-107` — transaksi `addCartItem` baca product via `findFirst` tanpa `FOR UPDATE`. Dua request concurrent bisa membaca stock yang sama, lolos validasi, dan overshoot stock.

### Implementation

1. **`modules/cart/cart.repository.ts`** — di `addCartItem()` transaction, tambahkan row lock sebelum validasi stock:

```typescript
await tx.$executeRaw`SELECT id FROM "Product" WHERE id = ${input.productId} FOR UPDATE`
const product = await tx.product.findFirst({
  where: { id: input.productId, deletedAt: null },
})
```

### Files Affected

- `modules/cart/cart.repository.ts`

### Verification

- [ ] Dua request concurrent add item ke cart yang sama → tidak overshoot stock
- [ ] `npm run lint`, `npm run build`, `npm run test`, `npm run test:integration`

---

## Phase 4: Order Status State Machine (P4)

### Problem

`modules/orders/order.service.ts` — hanya cek COMPLETED. Status bisa lompat PENDING → SHIPPED, PAID → PENDING, dll.

### Implementation

1. **`modules/orders/order.service.ts`** — buat validasi state machine:

```
Valid transitions:
  PENDING   → PAID, PROCESSING
  PAID      → PROCESSING
  PROCESSING → SHIPPED
  SHIPPED   → COMPLETED
  COMPLETED → (none)
```

2. Implementasi sebagai `VALID_TRANSITIONS` map dan fungsi `validateStatusTransition`.
3. Panggil di `updateOrderStatusService` sebelum update.

### Files Affected

- `modules/orders/order.service.ts`

### Verification

- [ ] PENDING → SHIPPED langsung → 409
- [ ] COMPLETED → PAID → 409
- [ ] PAID → PROCESSING → sukses
- [ ] PENDING → PAID → sukses
- [ ] `npm run lint`, `npm run build`, `npm run test`

---

## Phase 5: Global Rate Limit Reset On Success (P5)

### Problem

`modules/auth/auth.service.ts:77` hanya reset `emailIpKey`, `globalKey` tidak di-reset saat login sukses. Setelah 20 failed attempt, IP blokir ~60 detik.

### Implementation

1. **`modules/auth/auth.service.ts`** — di `login()`, setelah password valid, reset `globalKey`:

```typescript
await resetFailedLoginRateLimit(globalKey)
```

### Files Affected

- `modules/auth/auth.service.ts`

### Verification

- [ ] 20 failed → IP block → login dengan credential benar → sukses
- [ ] `npm run lint`, `npm run build`, `npm run test`

---

## Phase 6: Cegah Payment Status Regression (P6)

### Problem

`modules/orders/order.service.ts:38` — admin bisa ubah payment PAID → PENDING.

### Implementation

1. **`modules/orders/order.service.ts`** — di `updateOrderPaymentService`, sebelum update:

```typescript
if (order.paymentStatus === 'PAID' && paymentStatus === 'PENDING') {
  throw new AppError('Cannot change payment from PAID to PENDING', 409)
}
```

### Files Affected

- `modules/orders/order.service.ts`

### Verification

- [ ] Payment PAID → PENDING → 409
- [ ] Payment PENDING → PAID → sukses
- [ ] `npm run lint`, `npm run build`, `npm run test`

---

## Phase 7: Request Body Size Limit (P7)

### Problem

Semua `request.json()` tanpa batas ukuran body. Memory exhaustion DoS via payload besar.

### Implementation

1. **`lib/request.ts`** — buat fungsi `getJsonBody<T>` dengan limit 100KB.
2. **Semua route** yang panggil `request.json()` ganti ke `getJsonBody(request)`.

Route files (10):
- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/products/route.ts` (POST)
- `app/api/products/[id]/route.ts` (PATCH)
- `app/api/cart/items/route.ts`
- `app/api/cart/items/[productId]/route.ts` (PATCH)
- `app/api/checkout/route.ts`
- `app/api/admin/orders/[id]/status/route.ts`
- `app/api/admin/orders/[id]/payment/route.ts`
- `app/api/inventory/adjustments/route.ts`

### Files Affected

- `lib/request.ts`
- 10 route files

### Verification

- [ ] Body < 100KB → sukses
- [ ] Body > 100KB → 413
- [ ] `npm run lint`, `npm run build`, `npm run test`

---

## Verification Checklist (Final)

- [ ] `npm run lint` — tidak ada error baru
- [ ] `npm run build` — build sukses
- [ ] `npm run test` — unit test lulus
- [ ] `npm run test:integration` — jika test database tersedia
- [ ] Manual smoke test endpoint yang berubah
- [ ] Update `AGENTS.md` jika ada perubahan command, env, atau arsitektur
- [ ] Update `.opencode/docs/implement/` dengan implementation notes

## Prioritization Summary

| Phase | Issue | Risiko | File | Est. Waktu |
|-------|-------|--------|------|------------|
| P1 | Register rate limit mati | Register massal tanpa batas | `auth.service.ts` | 5 menit |
| P2 | JWT TTL 1 menit | Token ganti tiap request | `auth.ts` | 2 menit |
| P3 | Cart race condition | Cart overshoot stock | `cart.repository.ts` | 10 menit |
| P4 | Order tanpa state machine | Status lompat sembarangan | `order.service.ts` | 10 menit |
| P5 | Global rate limit no reset | IP legitimate terblokir | `auth.service.ts` | 2 menit |
| P6 | Payment bisa regress | Inkonsistensi payment | `order.service.ts` | 3 menit |
| P7 | Body size unlimited | Memory exhaustion DoS | `lib/request.ts` + 10 route files | 15 menit |

