# Plan: Cart Persistence, Checkout, Payment, Order Status, dan Inventory Audit

## Tujuan

Melengkapi fitur inti e-commerce yang masih kurang:

- Persistent cart di database.
- Checkout melalui endpoint baru `POST /api/checkout`.
- Simulasi payment gateway sederhana.
- Order status dan payment status dasar.
- Shipping data pada order.
- Inventory audit untuk checkout dan admin stock adjustment.

Keputusan scope:

- Checkout tidak lagi dibuat langsung lewat `POST /api/orders`, tetapi lewat `POST /api/checkout`.
- Jika simulasi payment gagal, API langsung return error, order tidak dibuat, stok tidak berkurang, dan cart tetap ada.
- Cancel order ditunda dan tidak masuk batch ini.

## 1. Database dan Prisma

Update file:

- `prisma/schema.prisma`
- `database/create-tables.sql`

Tambahkan enum:

```prisma
enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  COMPLETED
}

enum PaymentStatus {
  PENDING
  PAID
}

enum PaymentMethod {
  BANK_TRANSFER
  EWALLET
  COD
}

enum InventoryMovementType {
  ORDER_CHECKOUT
  ADMIN_ADJUSTMENT
}
```

Tambahkan model baru:

- `Cart`
- `CartItem`
- `InventoryMovement`

Update model `Order` dengan field:

- `status`
- `paymentStatus`
- `paymentMethod`
- `paymentReference`
- `shippingName`
- `shippingPhone`
- `shippingAddress`
- `shippingCity`
- `shippingPostalCode`
- `shippingCost`
- `subtotal`
- `total`

Relasi yang perlu ada:

- `User` ke `Cart`, `Order`, dan `InventoryMovement`.
- `Product` ke `CartItem`, `OrderItem`, dan `InventoryMovement`.
- `Order` ke `InventoryMovement`.
- `Cart` unique per `userId`.
- `CartItem` unique per kombinasi `cartId` dan `productId`.

Catatan:

- Tipe uang sementara tetap mengikuti project saat ini, yaitu `Float`, agar perubahan tetap minimal.
- Perubahan ke `Int` minor unit atau `Decimal` bisa dijadikan improvement terpisah.

## 2. Persistent Cart

Buat module baru:

- `modules/cart/cart.schema.ts`
- `modules/cart/cart.types.ts`
- `modules/cart/cart.repository.ts`
- `modules/cart/cart.service.ts`

Tambahkan endpoint:

- `GET /api/cart`
- `DELETE /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`

Aturan:

- Semua endpoint wajib memanggil `requireUser(request)`.
- Cart selalu berdasarkan `user.userId` dari token, bukan dari body request.
- Product harus aktif dengan `deletedAt: null`.
- Quantity harus integer positif untuk add/update.
- Quantity tidak boleh melebihi stok product aktif.
- `DELETE /api/cart` mengosongkan cart user.
- `DELETE /api/cart/items/:productId` menghapus satu item dari cart user.

## 3. Checkout

Buat module baru:

- `modules/checkout/checkout.schema.ts`
- `modules/checkout/checkout.types.ts`
- `modules/checkout/checkout.service.ts`
- Tambahkan `modules/checkout/checkout.repository.ts` jika transaksi checkout terlalu besar untuk service.

Tambahkan endpoint:

- `POST /api/checkout`

Contoh request body:

```json
{
  "paymentMethod": "EWALLET",
  "shippingName": "Customer",
  "shippingPhone": "08123456789",
  "shippingAddress": "Jl. Contoh No. 1",
  "shippingCity": "Jakarta",
  "shippingPostalCode": "12345",
  "shippingCost": 15000,
  "simulatePaymentStatus": "PAID"
}
```

Aturan schema:

- `paymentMethod`: `EWALLET`, `BANK_TRANSFER`, atau `COD`.
- `shippingName`, `shippingPhone`, `shippingAddress`, `shippingCity`, dan `shippingPostalCode` wajib diisi.
- `shippingCost` optional dengan default `0` atau nonnegative jika dikirim.
- `simulatePaymentStatus` optional untuk manual test, dengan nilai `PAID`, `PENDING`, atau `FAILED`.

Flow checkout:

1. Auth user dengan `requireUser(request)`.
2. Ambil cart user beserta items dan product.
3. Jika cart kosong, return HTTP `400`.
4. Validasi semua product masih aktif.
5. Validasi stok cukup.
6. Jalankan simulasi payment.
7. Jika payment `FAILED`, throw `AppError('Payment failed', 402)`.
8. Jika payment valid, mulai Prisma transaction.
9. Decrement stok dengan guarded `updateMany` dan kondisi `stock >= quantity`.
10. Hitung `subtotal`, `shippingCost`, dan `total`.
11. Buat order.
12. Buat order items.
13. Buat inventory movements.
14. Kosongkan cart.
15. Return order dan payment reference.

Status mapping:

- `EWALLET` default menjadi `paymentStatus: PAID` dan `order.status: PAID`.
- `BANK_TRANSFER` default menjadi `paymentStatus: PENDING` dan `order.status: PENDING`.
- `COD` default menjadi `paymentStatus: PENDING` dan `order.status: PENDING`.
- `simulatePaymentStatus: PAID` boleh override menjadi paid.
- `simulatePaymentStatus: PENDING` boleh override menjadi pending.
- `simulatePaymentStatus: FAILED` harus error tanpa membuat order.

## 4. Simulasi Payment Gateway

Buat module baru:

- `modules/payments/payment.service.ts`
- `modules/payments/payment.types.ts`

Behavior:

- Generate `paymentReference`, misalnya `PAY-<timestamp>-<random>`.
- Default method behavior:
  - `EWALLET` -> `PAID`
  - `BANK_TRANSFER` -> `PENDING`
  - `COD` -> `PENDING`
- Jika `simulatePaymentStatus` dikirim:
  - `FAILED` -> throw error ke checkout.
  - `PAID` -> return paid result.
  - `PENDING` -> return pending result.

Catatan:

- Simulasi dibuat deterministik agar manual testing mudah.
- Tidak perlu integrasi payment gateway eksternal di batch ini.

## 5. Order Management

Update module existing:

- `modules/orders/order.schema.ts`
- `modules/orders/order.types.ts`
- `modules/orders/order.repository.ts`
- `modules/orders/order.service.ts`

Tambahkan endpoint:

- `GET /api/orders/:id`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `PATCH /api/admin/orders/:id/payment`

Aturan:

- Customer hanya boleh melihat order miliknya sendiri.
- Admin bisa melihat semua order lewat `/api/admin/orders`.
- Admin bisa update `status` dan `paymentStatus`.
- Jika admin set `paymentStatus: PAID`, status boleh otomatis menjadi `PAID` jika order masih `PENDING`.
- Tidak ada endpoint cancel order di batch ini.

Status transition minimal:

- `PENDING -> PAID -> PROCESSING -> SHIPPED -> COMPLETED`
- Validasi transisi bisa dibuat sederhana di awal, tetapi hindari update dari `COMPLETED` ke status sebelumnya.

## 6. Inventory Audit

Buat module baru:

- `modules/inventory/inventory.schema.ts`
- `modules/inventory/inventory.types.ts`
- `modules/inventory/inventory.repository.ts`
- `modules/inventory/inventory.service.ts`

Tambahkan endpoint:

- `GET /api/inventory/movements`
- `POST /api/inventory/adjustments`

Aturan `GET /api/inventory/movements`:

- Admin only.
- Support query optional:
  - `page`
  - `limit`
  - `productId`
  - `type`

Contoh body `POST /api/inventory/adjustments`:

```json
{
  "productId": 1,
  "quantityChange": 5,
  "note": "Restock manual"
}
```

Aturan adjustment:

- Admin only.
- `quantityChange` boleh positif atau negatif.
- Stock akhir tidak boleh negatif.
- Buat `InventoryMovement` dengan type `ADMIN_ADJUSTMENT`.
- Simpan `stockBefore`, `stockAfter`, `quantityChange`, `userId`, dan `note`.

Aturan movement checkout:

- Type `ORDER_CHECKOUT`.
- `quantityChange` negatif.
- Simpan `stockBefore` dan `stockAfter` per product.
- Simpan `orderId` untuk traceability.

## 7. Customer UI

Update file:

- `lib/customer-api.ts`
- `app/customer/page.tsx`

Perubahan:

- Cart dibaca dari `GET /api/cart`.
- Add item memakai `POST /api/cart/items`.
- Update quantity memakai `PATCH /api/cart/items/:productId`.
- Remove item memakai `DELETE /api/cart/items/:productId`.
- Clear cart memakai `DELETE /api/cart` jika diperlukan.
- Checkout memakai `POST /api/checkout`.
- Tambahkan form shipping dan payment.
- Jika payment gagal, tampilkan error dan cart tetap ada.
- Setelah checkout sukses, refresh cart, products, dan orders.

## 8. Admin UI

Update file:

- `lib/admin-api.ts`
- `app/admin/page.tsx`

Tambahkan section sederhana:

- List all orders.
- Update order status.
- Update payment status.
- Inventory adjustment form.
- Inventory movement audit list.

Catatan:

- UI dibuat sederhana agar scope tidak terlalu besar.
- Fokus utama batch ini adalah correctness endpoint, transaksi, dan audit.

## 9. Dokumentasi dan Agent Instructions

Setelah implementasi selesai:

- Buat catatan implementasi di `.opencode/docs/implement/`.
- Evaluasi dan update `AGENTS.md` karena ada endpoint baru, model baru, dan flow testing baru.

Informasi yang perlu dicatat di implement docs:

- Ringkasan perubahan.
- File yang diubah.
- Verifikasi command yang dijalankan.
- Manual test yang sudah dan belum dijalankan.
- Risiko dan follow-up.

## 10. Verifikasi

Command minimal:

```bash
npm run prisma:generate
npm run lint
npm run build
```

Manual test customer:

1. Login customer.
2. Add item ke cart.
3. Refresh atau fetch cart ulang, pastikan cart persisted.
4. Update quantity cart.
5. Checkout `EWALLET` default, harus sukses paid.
6. Pastikan order dibuat, stok turun, cart kosong, dan audit movement ada.
7. Checkout dengan `simulatePaymentStatus: FAILED`, harus error.
8. Pastikan order tidak dibuat, stok tidak turun, dan cart tetap ada.
9. Checkout `COD`, order pending dan stok turun.

Manual test admin:

1. Login admin.
2. Lihat semua order.
3. Update payment status order.
4. Update order status.
5. Buat inventory adjustment positif.
6. Buat inventory adjustment negatif yang valid.
7. Coba adjustment negatif melebihi stok, harus gagal.
8. Pastikan stok berubah dan audit movement tercatat.

## 11. Urutan Implementasi Disarankan

1. Database schema dan SQL.
2. `npm run prisma:generate`.
3. Persistent cart module dan endpoint.
4. Payment simulation module.
5. Checkout module dan endpoint.
6. Inventory audit module dan endpoint.
7. Admin order/status/payment endpoint.
8. Customer UI dan `lib/customer-api.ts`.
9. Admin UI dan `lib/admin-api.ts`.
10. Dokumentasi implementasi dan update `AGENTS.md` jika diperlukan.
11. Lint, build, dan manual test.

## 12. Follow-up Di Luar Batch Ini

- Cancel order dan restore stock.
- Payment gateway nyata.
- Shipping provider dan ongkir dinamis.
- Nomor resi dan tracking shipment.
- Perubahan tipe uang dari `Float` ke `Int` minor unit atau `Decimal`.
- Product category, image, SKU, slug, dan variant.
- Automated tests untuk checkout, cart, payment simulation, inventory audit, dan RBAC.
