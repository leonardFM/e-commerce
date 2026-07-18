# Plan: Automated API Integration Tests

## Tujuan

Menambahkan automated test untuk memastikan fitur inti e-commerce berjalan benar:

- Auth dan RBAC.
- Product catalog dan admin product management.
- Persistent cart.
- Checkout transaction.
- Order customer dan admin order management.
- Payment simulation.
- Inventory adjustment dan inventory audit.

Prioritas utama adalah API integration test dengan PostgreSQL test database karena risiko terbesar project ada pada transaction, stock consistency, rollback, dan authorization.

## Strategi Testing

Mulai dari API integration test dengan database PostgreSQL asli, bukan unit test dulu.

Alasan:

- Checkout menyentuh banyak tabel: `Cart`, `CartItem`, `Order`, `OrderItem`, `Product`, dan `InventoryMovement`.
- Perlu membuktikan Prisma transaction, rollback, relation, dan constraint berjalan benar.
- Bug seperti tabel `Cart` belum ada hanya tertangkap oleh integration/database test.
- Unit test tetap berguna, tetapi setelah flow bisnis utama aman.

## Tools

Tambahkan dependency test:

- `vitest`
- Optional: `supertest` jika test dijalankan terhadap server HTTP.
- Optional: `@vitest/coverage-v8` untuk coverage report.

Script yang disarankan:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:integration": "vitest run tests/integration",
  "test:coverage": "vitest run --coverage"
}
```

## Test Database Strategy

Gunakan database test terpisah, misalnya:

- Development DB: `solutech`
- Test DB: `solutech_test`

Environment test:

- `DATABASE_URL` diarahkan ke `solutech_test`.
- `JWT_SECRET` diset untuk test.

Sebelum test:

1. Apply migration ke test DB.
2. Bersihkan data.
3. Seed user admin, user customer, dan product test.

Urutan cleanup:

1. `InventoryMovement`
2. `CartItem`
3. `Cart`
4. `OrderItem`
5. `Order`
6. `Product`
7. `User`

## Struktur File

```text
tests/
  helpers/
    api.ts
    db.ts
    fixtures.ts
  integration/
    auth.test.ts
    products.test.ts
    cart.test.ts
    checkout.test.ts
    orders.test.ts
    inventory.test.ts
```

## Phase 1: Test Setup

Buat konfigurasi:

- `vitest.config.ts`
- `tests/helpers/db.ts`
- `tests/helpers/api.ts`
- `tests/helpers/fixtures.ts`

Helper yang dibutuhkan:

- `resetDatabase()`
- `seedUsers()`
- `seedProducts()`
- `loginAsAdmin()`
- `loginAsCustomer()`
- `authHeader(token)`
- `createProductFixture()`

Acceptance criteria:

- `npm run test` bisa berjalan.
- Test bisa connect ke database test.
- Test bisa seed admin/customer/product.

## Phase 2: Auth dan RBAC Tests

File:

- `tests/integration/auth.test.ts`

Test cases:

- Login admin berhasil.
- Login customer berhasil.
- Login dengan password salah gagal.
- Protected endpoint tanpa token return `401`.
- Customer akses admin endpoint return `403`.
- Admin akses admin endpoint berhasil.
- Token invalid return `401`.

Endpoint:

- `POST /api/auth/login`
- `GET /api/cart`
- `GET /api/admin/orders`
- `GET /api/inventory/movements`

## Phase 3: Product Tests

File:

- `tests/integration/products.test.ts`

Test cases:

- List products berhasil.
- Search product bekerja.
- Pagination bekerja.
- Admin create product berhasil.
- Admin update product berhasil.
- Admin soft delete product berhasil.
- Soft-deleted product tidak muncul di list.
- Customer tidak bisa create/update/delete product.
- Price negatif gagal `400`.
- Stock negatif gagal `400`.

Endpoint:

- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`

## Phase 4: Cart Persistence Tests

File:

- `tests/integration/cart.test.ts`

Test cases:

- `GET /api/cart` membuat atau mengambil cart user.
- Add item ke cart berhasil.
- Add product sama meng-increment quantity.
- Fetch cart ulang tetap berisi item.
- Update quantity berhasil.
- Update quantity ke `0` menghapus item.
- Remove item berhasil.
- Clear cart berhasil.
- Product tidak ada return `404`.
- Quantity melebihi stock return `409`.
- Cart user A tidak bercampur dengan user B.

Endpoint:

- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`
- `DELETE /api/cart`

## Phase 5: Checkout Tests

File:

- `tests/integration/checkout.test.ts`

Ini phase paling penting.

Test success `EWALLET`:

- Add product ke cart.
- Checkout `EWALLET`.
- Response success `201`.
- `paymentStatus = PAID`.
- `order.status = PAID`.
- `subtotal + shippingCost = total`.
- Order item sesuai cart.
- Stock product berkurang.
- Cart kosong.
- Inventory movement `ORDER_CHECKOUT` dibuat.
- Movement punya `stockBefore`, `stockAfter`, `quantityChange`, dan `orderId`.

Test success `COD`:

- Checkout `COD`.
- `paymentStatus = PENDING`.
- `order.status = PENDING`.
- Stock tetap berkurang.
- Cart kosong.
- Inventory movement dibuat.

Test failed payment:

- Add product ke cart.
- Checkout dengan `simulatePaymentStatus: FAILED`.
- Return `402`.
- Tidak ada order baru.
- Stock tidak berubah.
- Cart tetap berisi item.
- Tidak ada inventory movement baru.

Test insufficient stock:

- Cart quantity melebihi stock aktual.
- Checkout gagal `409`.
- Tidak ada order.
- Stock tidak berubah.
- Cart tetap ada.
- Tidak ada movement baru.

Validation tests:

- Cart kosong return `400`.
- Missing shipping field return `400`.
- Negative shipping cost return `400`.
- Invalid payment method return `400`.

Endpoint:

- `POST /api/checkout`

## Phase 6: Order Tests

File:

- `tests/integration/orders.test.ts`

Customer tests:

- Customer bisa list order miliknya.
- Customer bisa detail order miliknya.
- Customer tidak bisa melihat order user lain, return `404`.
- Response order punya status/payment/shipping fields.

Admin tests:

- Admin bisa list semua order.
- Admin bisa update order status.
- Admin bisa update payment status.
- Update payment ke `PAID` otomatis set status ke `PAID` jika sebelumnya `PENDING`.
- Completed order tidak bisa diregress.
- Customer tidak bisa akses admin order endpoint.

Endpoint:

- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `PATCH /api/admin/orders/:id/payment`

## Phase 7: Inventory Tests

File:

- `tests/integration/inventory.test.ts`

Test cases:

- Admin bisa list inventory movements.
- Filter by `productId` bekerja.
- Filter by `type` bekerja.
- Admin adjustment positif menambah stock.
- Admin adjustment negatif mengurangi stock.
- Adjustment negatif melebihi stock return `409`.
- Adjustment gagal tidak membuat movement.
- `quantityChange: 0` return `400`.
- Customer tidak bisa akses inventory endpoint.
- Checkout membuat movement `ORDER_CHECKOUT`.
- Admin adjustment membuat movement `ADMIN_ADJUSTMENT`.

Endpoint:

- `GET /api/inventory/movements`
- `POST /api/inventory/adjustments`

## Phase 8: Transaction dan Concurrency Tests

File:

- `tests/integration/checkout-concurrency.test.ts`

Test cases:

- Product stock `1`.
- Dua customer punya cart quantity `1`.
- Jalankan dua checkout bersamaan.
- Hanya satu checkout berhasil.
- Checkout lain gagal `409`.
- Stock akhir `0`.
- Hanya satu order dibuat.
- Hanya satu inventory movement checkout dibuat.

Catatan:

- Ini bisa masuk phase lanjutan setelah checkout test dasar stabil.
- Concurrency test bisa flaky jika test environment tidak dikontrol dengan baik.

## Phase 9: Unit Tests Setelah Integration Stabil

Unit test cocok untuk logic kecil:

- Payment simulation mapping.
- Schema validation.
- Status transition rules.
- Helper parse id.
- Money calculation jika nanti dipisah helper.

File contoh:

```text
tests/unit/
  payment.service.test.ts
  order-status.test.ts
  schema-validation.test.ts
```

## MVP Scope

Jika ingin cepat, implementasi awal cukup:

1. Setup Vitest dan test DB helper.
2. Auth login admin/customer.
3. Customer add product ke cart.
4. Checkout `EWALLET` sukses.
5. Assert order dibuat, stock turun, cart kosong, movement ada.
6. Checkout `simulatePaymentStatus: FAILED`.
7. Assert order tidak dibuat, stock tidak turun, cart tetap ada.
8. Customer tidak bisa akses `/api/admin/orders`.

## Verification

Command target:

```bash
npm run test
npm run test:integration
npm run lint
npm run build
```

Manual verification tetap boleh dilakukan untuk UI, tetapi automated API integration test menjadi safety net utama.

## Risiko dan Catatan

- Test membutuhkan PostgreSQL test database aktif.
- Jangan gunakan database development untuk test otomatis.
- Test harus membersihkan data agar deterministic.
- Jika endpoint route handler sulit dites langsung, gunakan server Next test/dev dan request HTTP sungguhan.
- Concurrency test bisa flaky jika tidak didesain hati-hati; taruh di phase lanjutan.
