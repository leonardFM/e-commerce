# Pino Structured Logging Plan

## Goal

Tambahkan manajemen log aplikasi menggunakan `pino` dengan structured JSON logging, redaction data sensitif, error logging terpusat, dan business event logs pada proses penting e-commerce.

## Current State

- Belum ada logger aplikasi terpusat.
- Beberapa output `console.*` hanya ada pada seed script.
- API route saat ini memakai pola `try/catch` lalu `failure(error)` dari `lib/response.ts`.
- `lib/response.ts` saat ini mengembalikan `error.message` untuk semua `Error` non-`AppError`, termasuk HTTP 500.
- Redis/cache/rate-limit/lock helper saat ini fail-open secara silent ketika terjadi error.

## Design Principles

- Gunakan `pino` sebagai logger utama.
- Log dalam format JSON agar kompatibel dengan Docker stdout, Vercel, Cloud Run, Loki, ELK, Datadog, atau provider observability lain.
- Jangan memakai `console.log` langsung di application code.
- Jangan log secret atau data sensitif.
- Error tak terduga harus dilog server-side, tetapi response client tetap generic.
- Keep changes minimal dan mengikuti layering project: route untuk HTTP concern, service untuk business event, helper infra untuk Redis/cache/lock logs.

## Implementation Steps

### 1. Add Dependency

Jalankan:

```bash
npm install pino
```

Expected changed files:

- `package.json`
- `package-lock.json`

### 2. Add Central Logger

Buat `lib/logger.ts`.

Requirements:

- Export singleton `logger`.
- Gunakan level dari env `LOG_LEVEL`.
- Default level:
  - `debug` saat `NODE_ENV=development`
  - `info` selain development
- Gunakan redaction untuk field sensitif:
  - `password`
  - `passwordHash`
  - `token`
  - `authorization`
  - `headers.authorization`
  - `input.password`
  - `*.password`
  - `*.token`

Contoh penggunaan target:

```ts
logger.info({ userId, orderId, total }, 'order_created')
logger.warn({ productId, requestedQuantity }, 'insufficient_stock')
logger.error({ err: error, method, path }, 'unhandled_api_error')
```

### 3. Harden Error Response Logging

Update `lib/response.ts`.

Requirements:

- Tambahkan optional context pada `failure()`:

```ts
failure(error, { feature, method, path, userId })
```

- `ZodError` tetap response HTTP 400 dengan issues.
- `AppError` tetap response sesuai `statusCode` dan `message`.
- `Error` non-`AppError`:
  - Log detail ke server dengan `logger.error`.
  - Response client gunakan `{ error: 'Internal Server Error' }` dengan status 500.
- Unknown error juga dilog dan response generic 500.

### 4. Add Failure Context In API Routes

Update route yang sudah memakai `failure(error)` agar mengirim context minimal.

Routes yang perlu disentuh:

- `app/api/auth/login/route.ts`
- `app/api/products/route.ts`
- `app/api/products/[id]/route.ts`
- `app/api/cart/route.ts`
- `app/api/cart/items/route.ts`
- `app/api/cart/items/[productId]/route.ts`
- `app/api/checkout/route.ts`
- `app/api/orders/route.ts`
- `app/api/orders/[id]/route.ts`
- `app/api/admin/orders/route.ts`
- `app/api/admin/orders/[id]/status/route.ts`
- `app/api/admin/orders/[id]/payment/route.ts`
- `app/api/inventory/movements/route.ts`
- `app/api/inventory/adjustments/route.ts`

Context minimal:

- `feature`
- `method`
- `path`
- `userId` jika route sudah mendapatkan authenticated user

Contoh:

```ts
return failure(error, {
  feature: 'checkout',
  method: request.method,
  path: request.nextUrl.pathname,
  userId: user.userId,
})
```

### 5. Add Business Event Logs

Tambahkan logs di service layer untuk proses penting.

#### Auth

File: `modules/auth/auth.service.ts`

Events:

- `auth_login_succeeded`
- `auth_login_failed`
- `auth_login_rate_limited`

Rules:

- Jangan log password.
- Jangan log JWT token.
- Boleh log email normalized, userId, dan role.

#### Products

File: `modules/products/product.service.ts`

Events:

- `product_created`
- `product_updated`
- `product_deleted`
- `product_cache_hit` pada level `debug`
- `product_cache_miss` pada level `debug`

#### Cart

File: `modules/cart/cart.service.ts`

Events:

- `cart_item_added`
- `cart_item_updated`
- `cart_item_removed`
- `cart_cleared`
- Warn untuk product missing atau quantity melebihi stock.

#### Checkout

File: `modules/checkout/checkout.service.ts`

Events:

- `checkout_started`
- `checkout_lock_conflict`
- `checkout_payment_failed`
- `checkout_order_created`
- `checkout_completed`

#### Orders

File: `modules/orders/order.service.ts`

Events:

- `order_created`
- `order_status_updated`
- `order_payment_updated`
- Warn untuk invalid order transition.

#### Inventory

File: `modules/inventory/inventory.service.ts`

Events:

- `inventory_adjustment_created`

### 6. Add Infra Logs For Redis Fail-Open

Tambahkan warning/error logs pada helper infra yang saat ini silent.

Files:

- `lib/cache.ts`
- `lib/lock.ts`
- `lib/rate-limit.ts`

Events:

- `cache_get_failed`
- `cache_set_failed`
- `cache_delete_failed`
- `cache_delete_by_prefix_failed`
- `redis_lock_acquire_failed`
- `redis_lock_release_failed`
- `rate_limit_check_failed`
- `rate_limit_increment_failed`
- `rate_limit_reset_failed`

Rules:

- Tetap fail-open sesuai aturan project.
- Jangan mengubah behavior Redis/cache/rate-limit selain menambahkan log.

### 7. Update Environment Documentation

Jika `.env.example` ada, tambahkan:

```env
LOG_LEVEL=info
```

### 8. Update AGENTS.md

Update `AGENTS.md` karena perubahan ini menambah env var dan aturan workflow logging.

Tambahkan informasi:

- `LOG_LEVEL` opsional untuk mengatur level logger.
- Gunakan `logger` dari `lib/logger.ts` untuk application logs.
- Jangan gunakan `console.log` langsung di app code.
- Jangan log password, token, authorization header, secret, atau data sensitif.

### 9. Add Implementation Note

Setelah implementasi, buat atau update catatan di `.opencode/docs/implement/`.

Isi minimal:

- Ringkasan perubahan.
- File yang diubah.
- Verifikasi yang dijalankan.
- Manual test yang belum dijalankan.
- Risiko dan follow-up.

### 10. Verification

Minimal jalankan:

```bash
npm run lint
```

Jika memungkinkan, jalankan juga:

```bash
npm run build
```

Untuk API behavior, manual smoke test yang direkomendasikan:

- Login admin dan customer.
- Trigger login gagal.
- Fetch product list/detail.
- Tambah/update/hapus cart item.
- Checkout sukses.
- Checkout payment failed.
- Admin update order status/payment.
- Admin inventory adjustment.
- Matikan atau kosongkan `REDIS_URL` dan pastikan aplikasi tetap berjalan tanpa Redis.

## Risks And Follow-Up

- Terlalu banyak business logs bisa membuat noise di production; gunakan `debug` untuk cache-level logs.
- Route context harus ditambahkan konsisten agar `unhandled_api_error` mudah ditelusuri.
- Redaction perlu diperluas jika nanti ada field sensitif baru.
- Jika production membutuhkan request correlation, follow-up berikutnya adalah menambahkan request id/correlation id.
- Jika membutuhkan alerting/error tracking, follow-up berikutnya adalah integrasi Sentry atau platform observability lain.
