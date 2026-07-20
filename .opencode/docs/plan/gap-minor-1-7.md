# Gap Minor Backend — Perbaikan 1-7

Source: Laporan evaluasi backend — gap minor

## Gap #1: OrderItem — Tambah productName

**Issue:** `OrderItem` tidak punya field `productName`. Saat ini `productName` di-resolve via relasi `item.product.name` di `toOrderRecord()`. Jika nama produk diubah atau produk di-soft-delete, riwayat order akan menampilkan nama baru, bukan nama saat order dibuat.

### Perubahan

**A. Prisma schema (`prisma/schema.prisma`):**
```prisma
model OrderItem {
  // ... existing fields
  productName String
  // ...
}
```

**B. SQL (`database/create-tables.sql`):**
Tambah kolom `"productName" TEXT NOT NULL` di tabel `OrderItem`.

**C. Repository (`modules/checkout/checkout.repository.ts`):**
Saat `tx.order.create` di `checkoutCart()`, tambah `productName: item.product.name` di `items.create`.

**D. Repository (`modules/orders/order.repository.ts`):**
- Saat `tx.order.create` di `createOrder()`, tambah `productName: product.name` di `items.create`.
- Di `toOrderRecord()`, baca `productName` dari `item.productName`, bukan `item.product.name`.
- Hapus `.include: { items: { include: { product: true } } }` di `findOrdersByUser`, `findOrderByUser`, `listOrdersForAdmin`, `updateOrderStatus`, `updateOrderPayment`, `findOrderById` — ganti jadi `include: { items: true }` (tidak perlu include product untuk nama).

**E. Seeds (`prisma/seed.js`):**
Tidak perlu perubahan — seed tidak membuat order.

### Verification
- `npm run prisma:generate`
- `npm run build`

---

## Gap #2: Prisma Schema — Tambah @@index

**Issue:** SQL punya 5 indexes, tapi Prisma schema tidak mendeklarasikannya. Jika ada yang menjalankan `prisma db push` atau migration baru, indexes ini hilang.

### Perubahan

**A. `prisma/schema.prisma`:**
```prisma
model Product {
  // ...
  @@index([deletedAt, createdAt])
}

model Order {
  // ...
  @@index([userId, createdAt])
  @@index([createdAt])
}

model InventoryMovement {
  // ...
  @@index([productId, createdAt])
  @@index([type, createdAt])
}
```

### Verification
- `npm run prisma:generate`
- `npm run build`

---

## Gap #3: Check Constraints — Prisma vs SQL

**Issue:** 7 CHECK constraints (stock >= 0, price >= 0, quantity > 0, shippingCost >= 0, subtotal >= 0, total >= 0) hanya ada di SQL, tidak di Prisma. Prisma tidak punya native `@@constraint`, jadi solusi terbaik adalah dokumentasi.

### Perubahan

**A. `AGENTS.md` — Database And Prisma section:**
Tambah catatan: "Check constraints (stock >= 0, price >= 0, quantity > 0, shippingCost >= 0, subtotal >= 0, total >= 0) hanya didefinisikan di `database/create-tables.sql`, tidak di Prisma schema. Setelah `prisma db push` atau migration baru, constraint ini harus ditambahkan manual ke database."

**B. Tidak ada perubahan kode** — application-level sudah memvalidasi di repository/service (stok negatif, quantity > 0, dll). Constraint database sebagai safety net.

---

## Gap #4: Legacy `POST /api/orders` — Deprecate

**Issue:** `POST /api/orders` membuat order langsung tanpa flow checkout (tidak ada shipping info, payment simulation, cart clearing). Fungsinya redundan dengan `POST /api/checkout`. Tidak jelas digunakan untuk apa.

### Opsi A — Hapus endpoint (Recommended)
**A1.** Hapus route `POST` di `app/api/orders/route.ts` — hanya sisakan `GET`.
**A2.** Hapus `createOrderService` dari `modules/orders/order.service.ts`.
**A3.** Hapus `createOrder` dari `modules/orders/order.repository.ts`.
**A4.** Hapus `createOrderSchema` dari `modules/orders/order.schema.ts` (jika hanya dipakai oleh endpoint ini).
**A5.** Update `AGENTS.md` — hapus `POST /api/orders` dari daftar existing endpoints.

### Opsi B — Biarkan dengan catatan deprecation
Tambah komentar di route, service, repository: `@deprecated Use POST /api/checkout instead.`

---

## Gap #5: Content-Security-Policy Header

**Issue:** CSP belum diaktifkan. AGENTS.md sudah acknowledge. Perlu diuji build/browser sebelum ditambahkan.

### Perubahan

**`next.config.mjs`:**
Tambah CSP header. Mulai dengan policy longgar (report-only) untuk testing:

```javascript
// CSP value (non-report-only)
const cspValue = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')
```

Tambahkan ke `headers()` di `next.config.mjs`.

**Catatan:** `'unsafe-inline'` diperlukan untuk Next.js client-side bundles dan CSS-in-JS. Jika ingin stricter, perlu eval `nonce` atau `hash` yang membutuhkan konfigurasi Next.js lebih lanjut.

### Verification
- `npm run build`
- Manual test browser: buka semua halaman, pastikan tidak ada CSP violation di console.

---

## Gap #6: Logger Redact — Email, Shipping, Address

**Issue:** `email`, `shippingPhone`, `shippingAddress` tidak di-redact oleh Pino. AGENTS.md secara eksplisit melarang log data ini. Meski application code tidak langsung log field-field ini, defense-in-depth perlu menambahkannya di redact paths.

### Perubahan

**`lib/logger.ts` — redact paths:**
Tambah:
```javascript
'*.email',
'*.shippingPhone',
'*.shippingAddress',
'*.phone',
'*.address',
```

### Verification
- `npm run lint`
- `npm run build`

---

## Gap #7: Unit Tests

**Issue:** Tidak ada unit test files di project. Semua test adalah integration test (`tests/`). Sebaiknya buat unit test untuk utility library (`lib/`).

### Perubahan

**A. `tests/logger.test.ts`** — sudah ada. Cek ulang coverage.

**B. Tambah unit test untuk `lib/errors.ts`:**
- Test `AppError` constructor dan properti

**C. Tambah unit test untuk `lib/auth.ts`:**
- `getBearerToken()` dengan valid header, invalid header, null
- `signJwt()` dan `verifyJwt()` mock (butuh secret)

**D. Tambah unit test untuk `lib/param.ts`:**
- `parsePositiveInt()` dengan valid input, NaN, negative, nol

**E. Update CI (`ci.yml`):**
- Tambah `npm run test` (unit) sebelum `npm run test:integration`

### Prioritization: LOW — integration tests sudah mencakup semua flow.

---

## Ringkasan Prioritas

| Gap | File Utama | Effort | Dampak | Prioritas |
|-----|-----------|--------|--------|-----------|
| #1 OrderItem productName | `prisma/schema.prisma`, `checkout.repository.ts`, `order.repository.ts` | **Besar** (3 file, + migration) | Data integrity riwayat order | **High** |
| #2 Index di Prisma | `prisma/schema.prisma` | **Kecil** (5 baris) | Mencegah index hilang | **High** |
| #3 Check constraints doc | `AGENTS.md` | **Kecil** (1 paragraf) | Dokumentasi | **Medium** |
| #4 Hapus POST /api/orders | `orders/route.ts`, service, repository | **Sedang** (4-5 file) | Menghilangkan endpoint redundan | **Medium** |
| #5 CSP header | `next.config.mjs` | **Kecil** (10 baris) | Security | **Medium** |
| #6 Logger redact | `lib/logger.ts` | **Kecil** (3 baris) | Data leak prevention | **Low** |
| #7 Unit tests | `tests/*.test.ts` | **Besar** (3-4 file baru) | Test coverage | **Low** |
