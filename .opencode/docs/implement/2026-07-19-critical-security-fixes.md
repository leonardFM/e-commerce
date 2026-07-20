# Critical Security Fixes — Implementation

## Ringkasan

Implementasi 7 critical security fixes dari hasil audit backend: register rate limit, JWT TTL, cart race condition, order state machine, global rate limit reset, payment regression, dan request body size limit.

## Files Changed

| # | File | Change |
|---|------|--------|
| 1 | `modules/auth/auth.service.ts` | Fix register rate limit (increment counter), reset global key on login success |
| 2 | `lib/auth.ts` | JWT TTL 1m → 10m |
| 3 | `modules/cart/cart.repository.ts` | Tambah `SELECT FOR UPDATE` di addCartItem transaction |
| 4 | `modules/orders/order.service.ts` | State machine order status + cegah payment regression |
| 5 | `lib/request.ts` | Tambah `getJsonBody()` dengan 100KB limit |
| 6 | `app/api/auth/login/route.ts` | `request.json()` → `getJsonBody()` |
| 7 | `app/api/auth/register/route.ts` | `request.json()` → `getJsonBody()` |
| 8 | `app/api/products/route.ts` | `request.json()` → `getJsonBody()` (POST) |
| 9 | `app/api/products/[id]/route.ts` | `request.json()` → `getJsonBody()` (PATCH) |
| 10 | `app/api/cart/items/route.ts` | `request.json()` → `getJsonBody()` |
| 11 | `app/api/cart/items/[productId]/route.ts` | `request.json()` → `getJsonBody()` (PATCH) |
| 12 | `app/api/checkout/route.ts` | `request.json()` → `getJsonBody()` |
| 13 | `app/api/admin/orders/[id]/status/route.ts` | `request.json()` → `getJsonBody()` |
| 14 | `app/api/admin/orders/[id]/payment/route.ts` | `request.json()` → `getJsonBody()` |
| 15 | `app/api/inventory/adjustments/route.ts` | `request.json()` → `getJsonBody()` |

## Detail Perubahan

### P1 — Register Rate Limit
- `auth.service.ts` sebelum: `assertFailedLoginRateLimit` tanpa `incrementFailedLoginRateLimit` — counter tidak pernah dibuat.
- Sesudah: `incrementFailedLoginRateLimit({ key: registerKey, ... })` dipanggil sebelum throw di 2 tempat (duplicate email dan P2002 catch).

### P2 — JWT TTL
- `lib/auth.ts`: `'1m'` → `'10m'` sesuai AGENTS.md.
- Sliding session threshold 120 detik di `requireUser()` tetap cocok.

### P3 — Cart FOR UPDATE
- `cart.repository.ts`: tambah `SELECT id FROM "Product" WHERE id = ? FOR UPDATE` sebelum read product di `addCartItem` transaction, mencegah race condition concurrent add.

### P4 — Order State Machine
- `order.service.ts`:
  - `VALID_TRANSITIONS` map: PENDING→PAID|PROCESSING, PAID→PROCESSING, PROCESSING→SHIPPED, SHIPPED→COMPLETED, COMPLETED→(none)
  - `validateStatusTransition()` throw 409 jika transisi tidak valid
  - Ganti pengecekan COMPLETED manual dengan state machine

### P5 — Global Rate Limit Reset
- `auth.service.ts`: tambah `resetFailedLoginRateLimit(globalKey)` setelah login sukses, di samping reset `emailIpKey`.

### P6 — Payment Regression
- `order.service.ts`: tolak perubahan PAID→PENDING dengan `AppError('Cannot change payment from PAID to PENDING', 409)`.

### P7 — Body Size Limit
- `lib/request.ts`: `getJsonBody<T>()` membaca `request.text()`, batasi 100KB, lalu `JSON.parse`.
- Semua 10 route handler diganti `request.json()` → `getJsonBody(request)`.

## Verification

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors (5 pre-existing warnings) |
| `npm run build` | ✅ Compiled successfully |
| `npm run test` (unit) | ✅ 21/21 passed |

Pre-existing test failures (5 integration tests) tidak terkait perubahan ini.

## Manual Test Belum Dijalankan

1. Register rate limit: 4x register cepat dari IP yang sama → attempt ke-4 429
2. JWT sliding session: login → akses endpoint tanpa token baru
3. Cart concurrent: 2 `addCartItem` simultan → tidak overshoot stock
4. Order state machine: transisi invalid (PENDING→SHIPPED) → 409
5. Payment regression: PAID→PENDING → 409
6. Body size limit: payload > 100KB → 413

## Risiko / Follow-up

- `getJsonBody` menggunakan `request.text()` yang harus kompatibel dengan Next.js 16. Jika ada inkonsistensi di runtime, perlu fallback ke `request.json()`.
- Body size limit 100KB mungkin perlu disesuaikan untuk schema dengan deskripsi produk panjang.
- Test integration untuk state machine dan payment regression belum ada.
