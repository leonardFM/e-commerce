# Transaction Error Query Cache Logging Plan

## Goal

Lengkapi observability logging agar project mencatat:

- Log error yang konsisten untuk expected dan unexpected API errors.
- Log info terjadinya transaksi bisnis penting.
- Log performa query Prisma.
- Log performa cache Redis.

Semua log tetap menggunakan Pino structured logging dan mengikuti aturan keamanan data sensitif.

## Current State

- Logger utama ada di `lib/logger.ts`.
- Logger sudah mendukung `LOG_LEVEL`, `LOG_DESTINATION`, dan `LOG_FILE_PATH`.
- Unexpected API errors sudah dilog di `lib/response.ts` lewat event:
  - `unhandled_api_error`
  - `unknown_api_error`
- Expected errors berbasis `AppError` belum dilog terpusat.
- Validation errors berbasis `ZodError` belum dilog terpusat.
- Business transaction logs sudah ada sebagian:
  - `checkout_started`
  - `checkout_order_created`
  - `checkout_completed`
  - `order_created`
  - `order_status_updated`
  - `order_payment_updated`
  - `inventory_adjustment_created`
- Business transaction logs belum konsisten mencatat `durationMs` dan failure event.
- Cache helper sudah punya fail-open warning logs:
  - `cache_get_failed`
  - `cache_set_failed`
  - `cache_delete_failed`
  - `cache_delete_by_prefix_failed`
- Cache hit/miss saat ini sebagian dilog di `modules/products/product.service.ts`, tetapi masih memakai raw `cacheKey`.
- Prisma client di `lib/prisma.ts` masih memakai Prisma native log config dan belum mengirim query performance logs ke Pino secara structured.

## Design Principles

- Jangan log password, JWT token, authorization header, raw email, raw Redis/cache key, payment reference, shipping address, shipping phone, atau raw SQL params.
- Gunakan `logHash()` untuk identifier sensitif atau user-derived seperti email/cache key.
- Gunakan `durationMs` untuk semua log performa.
- Gunakan `debug` untuk query/cache normal agar tidak noisy di production.
- Gunakan `warn` untuk slow query/cache dan expected operational conflicts yang penting.
- Gunakan `error` untuk unexpected failures.
- Response API tidak boleh berubah akibat logging.
- Redis/cache tetap fail-open.
- PostgreSQL/Prisma tetap menjadi source of truth.

## Implementation Steps

### 1. Add Performance Helper

Buat `lib/performance.ts`.

Requirements:

- Tambahkan helper untuk menghitung durasi berbasis `process.hrtime.bigint()`.
- Minimal API:

```ts
export function startTimer() {
  return process.hrtime.bigint()
}

export function elapsedMs(start: bigint) {
  return Number(process.hrtime.bigint() - start) / 1_000_000
}
```

### 2. Add Performance Environment Variables

Update `.env.example`.

Tambahkan:

```env
SLOW_QUERY_THRESHOLD_MS="100"
SLOW_CACHE_THRESHOLD_MS="50"
```

Default behavior jika env tidak diisi:

- `SLOW_QUERY_THRESHOLD_MS`: `100`
- `SLOW_CACHE_THRESHOLD_MS`: `50`

### 3. Centralize Expected Error Logging

Update `lib/response.ts`.

Requirements:

- `ZodError` tetap response `400 { error: 'Validation error', issues }`.
- `AppError` tetap response `{ error: error.message }` dengan status code saat ini.
- Unexpected errors tetap response generic `500 { error: 'Internal Server Error' }`.
- Tambahkan structured logs:
  - `api_validation_error` untuk Zod errors.
  - `api_app_error` untuk `AppError`.
  - Existing `unhandled_api_error` dan `unknown_api_error` tetap ada.
- Jangan log full request body.
- Untuk `api_app_error`:
  - status `404` bisa `debug` agar tidak noisy.
  - status `400`, `401`, `403` bisa `warn` atau `debug` sesuai noise; default gunakan `warn` untuk simplicity.
  - status `409`, `429`, dan `>=500` gunakan `warn`.
- Context yang dipakai tetap dari route:
  - `feature`
  - `method`
  - `path`
  - `userId`

Contoh target log:

```json
{
  "msg": "api_app_error",
  "statusCode": 409,
  "feature": "checkout",
  "method": "POST",
  "path": "/api/checkout",
  "userId": 2
}
```

### 4. Add Transaction Duration And Failure Logs

Update service layer, bukan route handler.

Files:

- `modules/checkout/checkout.service.ts`
- `modules/orders/order.service.ts`
- `modules/inventory/inventory.service.ts`

Requirements:

- Tambahkan `durationMs` pada transaction success logs.
- Tambahkan failure logs untuk transaction/business processes yang penting.
- Jangan mengubah transaction behavior.

#### Checkout Events

Existing:

- `checkout_started`
- `checkout_order_created`
- `checkout_completed`
- `checkout_payment_failed`
- `checkout_lock_conflict`

Add/adjust:

- `checkout_completed` harus mencatat `durationMs`.
- Tambahkan `checkout_failed` untuk error setelah process start, termasuk validation cart, stock conflict, DB error, atau payment failure.
- Jangan double-log terlalu banyak; `checkout_payment_failed` boleh tetap ada sebagai domain-specific warning.

Fields aman:

- `userId`
- `orderId`
- `total`
- `paymentMethod`
- `paymentStatus`
- `durationMs`

#### Order Events

Existing:

- `order_created`
- `order_status_updated`
- `order_payment_updated`

Add/adjust:

- `order_created` tambah `durationMs`.
- Tambahkan `order_create_failed`.
- `order_status_updated` tambah `durationMs`.
- `order_payment_updated` tambah `durationMs`.

Fields aman:

- `userId`
- `orderId`
- `total`
- `status`
- `paymentStatus`
- `durationMs`

#### Inventory Events

Existing:

- `inventory_adjustment_created`

Add/adjust:

- `inventory_adjustment_created` tambah `durationMs`.
- Tambahkan `inventory_adjustment_failed`.

Fields aman:

- `userId`
- `productId`
- `quantityChange`
- `movementId`
- `durationMs`

### 5. Add Prisma Query Performance Logging

Update `lib/prisma.ts`.

Preferred approach:

- Gunakan Prisma extension atau middleware yang mengukur durasi setiap query.
- Log menggunakan Pino, bukan Prisma native query stdout.
- Hindari log raw SQL dan params.

Requirements:

- Log query normal pada level `debug` dengan event `prisma_query_performance`.
- Log slow query pada level `warn` dengan event `prisma_slow_query`.
- Fields:
  - `model`
  - `action`
  - `durationMs`
  - `thresholdMs` untuk slow query
- Threshold dari `SLOW_QUERY_THRESHOLD_MS`, default `100`.
- Jangan log raw query, params, atau data row.
- Pertahankan singleton Prisma global pattern.
- Pertimbangkan menghapus Prisma native query stdout config agar tidak double-log dan tidak keluar dari Pino/file destination.

Contoh target log:

```json
{
  "msg": "prisma_query_performance",
  "model": "Order",
  "action": "findMany",
  "durationMs": 24.7
}
```

Slow query:

```json
{
  "msg": "prisma_slow_query",
  "model": "Product",
  "action": "findMany",
  "durationMs": 185.2,
  "thresholdMs": 100
}
```

### 6. Add Cache Performance Logging

Update `lib/cache.ts`.

Requirements:

- Add timing to:
  - `getJsonCache`
  - `setJsonCache`
  - `deleteCacheKey`
  - `deleteCacheByPrefix`
- Add normal debug logs:
  - `cache_get`
  - `cache_set`
  - `cache_delete`
  - `cache_delete_by_prefix`
- Add slow warning log:
  - `cache_slow_operation`
- Fields:
  - `operation`
  - `durationMs`
  - `thresholdMs` for slow operations
  - `hit` for cache get
  - `keyHash` or `prefixHash`
  - `ttlSeconds` for set
  - `deletedCount` if available
- Threshold dari `SLOW_CACHE_THRESHOLD_MS`, default `50`.
- Existing fail-open logs tetap ada.
- Jangan log raw key/prefix.

Example:

```json
{
  "msg": "cache_get",
  "operation": "get",
  "hit": true,
  "keyHash": "abc123",
  "durationMs": 3.2
}
```

Slow cache:

```json
{
  "msg": "cache_slow_operation",
  "operation": "get",
  "keyHash": "abc123",
  "durationMs": 72.5,
  "thresholdMs": 50
}
```

### 7. Remove Raw Cache Key Logs From Product Service

Update `modules/products/product.service.ts`.

Requirements:

- Jangan log raw `cacheKey`.
- Opsi minimal:
  - Replace `cacheKey` dengan `keyHash: logHash(cacheKey)`.
- Opsi lebih clean:
  - Hapus product-level cache hit/miss logs dan andalkan `lib/cache.ts` yang sudah mencatat cache performance secara generic.
- Prefer opsi minimal bila ingin mempertahankan domain-specific event names.

### 8. Tests

Tambahkan atau update tests yang relevan.

Recommended tests:

- `failure(AppError)` tetap mengembalikan status/message yang sama dan tidak throw.
- Logger redaction/file logging test tetap pass.
- Cache performance logging tidak expose raw key.
- Performance helper menghitung numeric `durationMs`.

Jika Prisma query performance sulit diuji tanpa DB, cukup verifikasi lewat existing integration test atau build, dan dokumentasikan manual test.

### 9. Documentation Updates

Update `AGENTS.md` karena ada env dan workflow baru:

- `SLOW_QUERY_THRESHOLD_MS`
- `SLOW_CACHE_THRESHOLD_MS`
- Query performance logs harus memakai Pino structured logs.
- Jangan log raw SQL params atau raw cache key.

Update atau buat implementation note setelah implementasi:

```txt
.opencode/docs/implement/transaction-error-query-cache-logging.md
```

Isi minimal:

- Ringkasan perubahan.
- File yang diubah.
- Verifikasi yang dijalankan.
- Manual test yang belum dijalankan.
- Risiko/follow-up.

## Verification

### Automated

Run:

```bash
npm run lint
npm run build
npm run test -- tests/logger.test.ts
```

Jika menambah test baru, run test file terkait juga.

### Manual

Run app dengan file logging:

```bash
LOG_DESTINATION=file LOG_FILE_PATH=logs/app.jsonl LOG_LEVEL=debug npm run dev
```

Trigger flows:

- Login failed untuk melihat `api_app_error` atau auth failure logs.
- Product list/detail untuk cache hit/miss dan query performance.
- Cart add/update/remove untuk normal business logs dan query performance.
- Checkout success untuk `checkout_completed`, `order_created`, query performance, dan cache invalidation logs.
- Checkout failed payment untuk `checkout_payment_failed` dan `checkout_failed` tanpa order/stok/cart berubah.
- Admin inventory adjustment untuk `inventory_adjustment_created` dan transaction duration.

Validate `logs/app.jsonl`:

- Log berupa JSON Lines valid.
- Ada `durationMs` untuk query/cache/transaction logs.
- Slow operations punya `thresholdMs`.
- Tidak ada password, token, authorization header, raw email, raw cache key, payment reference, shipping phone, shipping address, atau raw SQL params.

## Risks And Follow-Up

- Query/cache debug logs bisa noisy; production sebaiknya pakai `LOG_LEVEL=info` kecuali sedang troubleshooting.
- Slow query threshold perlu tuning berdasarkan environment dan database size.
- Prisma extension/middleware bisa menambah overhead kecil pada setiap query.
- File logging tetap perlu rotation jika digunakan di luar local/demo.
- Jika butuh distributed tracing, follow-up berikutnya adalah request id/correlation id.
- Jika butuh metrics dashboard, follow-up berikutnya adalah Prometheus/OpenTelemetry integration.
