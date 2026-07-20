# Task: Critical Security Fixes

Source plan: `.opencode/docs/plan/critical-security-fixes-plan.md`

> Implementasi 7 critical security fixes: register rate limit, JWT TTL konsistensi, cart race condition, order state machine, global rate limit reset, payment regression, dan request body size limit.

---

## Phase 1: Register Rate Limit Fix (P1)

**Problem:** `assertFailedLoginRateLimit` dipanggil tapi `incrementFailedLoginRateLimit` tidak pernah dipanggil — rate limit register tidak aktif.

- [x] **`modules/auth/auth.service.ts`** — tambahkan import `incrementFailedLoginRateLimit` dari `@/lib/rate-limit`.
- [x] Setelah `throw AppError('Registration failed', 409)` (duplicate email), panggil `incrementFailedLoginRateLimit` dengan `registerKey` terlebih dahulu (sebelum throw).
- [x] Di catch block untuk `Prisma.PrismaClientKnownRequestError` code `P2002`, tambahkan `incrementFailedLoginRateLimit` untuk `registerKey` sebelum throw.
- [x] Verifikasi: `npm run build` sukses, unit test lulus.
- [ ] Manual test: 3+ register dari IP yang sama dalam 1 jam → attempt ke-4 mendapat 429 (perlu Redis dan dev server).

## Phase 2: JWT TTL Consistency (P2)

**Problem:** TTL 1 menit tidak sesuai AGENTS.md (10 menit), token ganti di hampir setiap request.

- [x] **`lib/auth.ts`** — ubah `setExpirationTime('1m')` menjadi `setExpirationTime('10m')`.
- [x] Verifikasi: `npm run build` sukses.
- [ ] Manual test: login → token tidak berganti di request normal (sisa > 2 menit).

## Phase 3: Cart Item Race Condition — FOR UPDATE (P3)

**Problem:** Transaksi `addCartItem` membaca product tanpa row lock → concurrent request bisa overshoot stock.

- [ ] **`modules/cart/cart.repository.ts`** — di `addCartItem()` transaction, tambahkan `SELECT ... FOR UPDATE` pada product row sebelum validasi stock:

```typescript
// Sebelum findFirst product, lock row dulu:
await tx.$executeRaw`SELECT id FROM "Product" WHERE id = ${input.productId} FOR UPDATE`
const product = await tx.product.findFirst({
  where: { id: input.productId, deletedAt: null },
})
if (!product) throw new AppError('Product not found', 404)
```

- [x] Pastikan validasi `nextQuantity > product.stock` menggunakan product yang sudah di-lock.
- [x] Verifikasi: `npm run build` sukses.
- [ ] Manual test concurrent: 2 request `addCartItem` simultan → tidak overshoot stock.

## Phase 4: Order Status State Machine (P4)

**Problem:** Order status bisa lompat sembarangan, tidak ada validasi transisi.

- [x] **`modules/orders/order.service.ts`** — buat `VALID_TRANSITIONS` map dan `validateStatusTransition` function.
- [x] Panggil `validateStatusTransition(order.status, status)` di `updateOrderStatusService` (ganti pengecekan COMPLETED sebelumnya).
- [x] Verifikasi: `npm run build` sukses, unit test lulus.
- [ ] Manual test: transisi invalid (PENDING → SHIPPED) → 409, transisi valid (PAID → PROCESSING) → sukses.

## Phase 5: Global Rate Limit Reset On Success (P5)

**Problem:** `globalKey` tidak di-reset saat login sukses → IP legitimate terblokir sementara.

- [x] **`modules/auth/auth.service.ts`** — tambahkan `resetFailedLoginRateLimit(globalKey)` setelah bcrypt compare sukses.
- [x] Verifikasi: `npm run build` sukses, unit test lulus.
- [ ] Manual test: 20 failed login dari IP yang sama → login sukses dengan credential benar (global counter ter-reset).

## Phase 6: Cegah Payment Status Regression (P6)

**Problem:** Admin bisa mengubah payment PAID → PENDING.

- [x] **`modules/orders/order.service.ts`** — tambahkan validasi payment regression (PAID → PENDING ditolak).
- [x] Verifikasi: `npm run build` sukses, unit test lulus.
- [ ] Manual test: payment PAID → PENDING → 409, payment PENDING → PAID → sukses.

## Phase 7: Request Body Size Limit (P7)

**Problem:** Tidak ada batasan ukuran request body → potensi memory exhaustion DoS.

- [x] **`lib/request.ts`** — buat fungsi `getJsonBody<T>` dengan limit 100KB.
- [x] **`app/api/auth/login/route.ts`** — ganti `request.json()` dengan `getJsonBody(request)`.
- [x] **`app/api/auth/register/route.ts`** — ganti `request.json()` dengan `getJsonBody(request)`.
- [x] **`app/api/products/route.ts`** (POST) — ganti `request.json()` dengan `getJsonBody(request)`.
- [x] **`app/api/products/[id]/route.ts`** (PATCH) — ganti `request.json()` dengan `getJsonBody(request)`.
- [x] **`app/api/cart/items/route.ts`** — ganti `request.json()` dengan `getJsonBody(request)`.
- [x] **`app/api/cart/items/[productId]/route.ts`** (PATCH) — ganti `request.json()` dengan `getJsonBody(request)`.
- [x] **`app/api/checkout/route.ts`** — ganti `request.json()` dengan `getJsonBody(request)`.
- [x] **`app/api/admin/orders/[id]/status/route.ts`** — ganti `request.json()` dengan `getJsonBody(request)`.
- [x] **`app/api/admin/orders/[id]/payment/route.ts`** — ganti `request.json()` dengan `getJsonBody(request)`.
- [x] **`app/api/inventory/adjustments/route.ts`** — ganti `request.json()` dengan `getJsonBody(request)`.
- [x] Verifikasi: `npm run build` sukses.
- [ ] Manual test: body < 100KB → sukses, body > 100KB → 413.

---

## Verification (Semua Phase)

- [x] `npm run lint` — 0 errors (5 pre-existing warnings, tidak terkait perubahan)
- [x] `npm run build` — build sukses
- [x] `npm run test` — 21/21 unit test lulus
- [ ] `npm run test:integration` — 5 pre-existing failures (tidak terkait perubahan)
- [ ] Manual smoke test endpoint yang berubah

## Follow-up

- [x] Update `AGENTS.md` — tambah `getJsonBody` di API conventions, tambah order state machine dan payment regression rules di Auth And Security.
- [x] Buat implementation notes di `.opencode/docs/implement/critical-security-fixes.md`.
