# Task: Cart Persistence, Checkout, Payment, Order Status, dan Inventory Audit

Source plan: `.opencode/docs/plan/cart-checkout-payment-inventory-plan.md`

## 1. Database dan Prisma

- [x] Update `prisma/schema.prisma` dengan enum `OrderStatus`, `PaymentStatus`, `PaymentMethod`, dan `InventoryMovementType`.
- [x] Tambahkan model `Cart`, `CartItem`, dan `InventoryMovement` di `prisma/schema.prisma`.
- [x] Update model `Order` dengan field status, payment, shipping, subtotal, shippingCost, dan total sesuai plan.
- [x] Tambahkan relasi `User`, `Product`, `Order`, `Cart`, `CartItem`, dan `InventoryMovement`, termasuk unique cart per user dan unique cart item per cart/product.
- [x] Update `database/create-tables.sql` agar selaras dengan perubahan Prisma.
- [x] Jalankan `npm run prisma:generate` setelah perubahan schema.

## 2. Persistent Cart API

- [x] Buat `modules/cart/cart.schema.ts` untuk validasi add/update item dan parameter cart.
- [x] Buat `modules/cart/cart.types.ts` untuk tipe domain cart.
- [x] Buat `modules/cart/cart.repository.ts` untuk akses Prisma cart/cart item/product aktif.
- [x] Buat `modules/cart/cart.service.ts` untuk business logic persistent cart.
- [x] Tambahkan `GET /api/cart` di `app/api/cart/route.ts` dengan `requireUser(request)` dan scope `user.userId`.
- [x] Tambahkan `DELETE /api/cart` di `app/api/cart/route.ts` untuk clear cart user.
- [x] Tambahkan `POST /api/cart/items` di `app/api/cart/items/route.ts` untuk add item.
- [x] Tambahkan `PATCH /api/cart/items/:productId` di `app/api/cart/items/[productId]/route.ts` untuk update quantity.
- [x] Tambahkan `DELETE /api/cart/items/:productId` di `app/api/cart/items/[productId]/route.ts` untuk remove item.
- [x] Pastikan semua cart endpoint memakai `requireUser(request)`, tidak menerima `userId` dari body, memfilter product aktif dengan `deletedAt: null`, dan menolak quantity melebihi stock.

## 3. Payment Simulation

- [x] Buat `modules/payments/payment.types.ts` untuk tipe method/status simulasi payment.
- [x] Buat `modules/payments/payment.service.ts` untuk generate `paymentReference` dan mapping default `EWALLET`, `BANK_TRANSFER`, dan `COD`.
- [x] Implementasikan override `simulatePaymentStatus` untuk `PAID`, `PENDING`, dan `FAILED` tanpa integrasi payment gateway eksternal.

## 4. Checkout API

- [x] Buat `modules/checkout/checkout.schema.ts` untuk validasi body checkout.
- [x] Buat `modules/checkout/checkout.types.ts` untuk tipe domain checkout.
- [x] Buat `modules/checkout/checkout.service.ts` untuk flow checkout.
- [x] Tambahkan `modules/checkout/checkout.repository.ts` jika transaksi checkout perlu dipisah dari service.
- [x] Tambahkan `POST /api/checkout` di `app/api/checkout/route.ts` dengan `requireUser(request)` dan response wrapper project.
- [x] Validasi cart user tidak kosong, semua product aktif `deletedAt: null`, dan stock cukup sebelum transaksi.
- [x] Jika payment simulation `FAILED`, return error `AppError('Payment failed', 402)` tanpa membuat order, tanpa mengurangi stock, dan tanpa menghapus cart.
- [x] Dalam Prisma transaction, decrement stock memakai guarded `updateMany` dengan kondisi `stock >= quantity`.
- [x] Hitung `subtotal`, `shippingCost`, dan `total` di checkout.
- [x] Buat order, order items, inventory movements `ORDER_CHECKOUT`, dan kosongkan cart dalam transaction.
- [x] Pastikan order creation tetap transaction-safe untuk stock dan totals.

## 5. Order Management API

- [x] Update `modules/orders/order.schema.ts` untuk validasi query/detail/status/payment update.
- [x] Update `modules/orders/order.types.ts` untuk status, payment, shipping, subtotal, dan total.
- [x] Update `modules/orders/order.repository.ts` untuk detail order user-scoped dan admin order management.
- [x] Update `modules/orders/order.service.ts` untuk customer detail, admin list, update status, dan update payment.
- [x] Tambahkan `GET /api/orders/:id` agar customer hanya dapat melihat order miliknya sendiri memakai `requireUser(request)` dan `user.userId`.
- [x] Tambahkan `GET /api/admin/orders` admin-only dengan `requireRole(request, 'ADMIN')`.
- [x] Tambahkan `PATCH /api/admin/orders/:id/status` admin-only untuk update status.
- [x] Tambahkan `PATCH /api/admin/orders/:id/payment` admin-only untuk update payment status.
- [x] Jika admin set `paymentStatus: PAID`, otomatis set order status ke `PAID` bila order masih `PENDING`.
- [x] Validasi transisi status minimal dan cegah update dari `COMPLETED` ke status sebelumnya.
- [x] Pastikan tidak menambahkan endpoint cancel order pada batch ini.

## 6. Inventory Audit API

- [x] Buat `modules/inventory/inventory.schema.ts` untuk validasi query movements dan body adjustment.
- [x] Buat `modules/inventory/inventory.types.ts` untuk tipe domain inventory movement/adjustment.
- [x] Buat `modules/inventory/inventory.repository.ts` untuk akses Prisma inventory dan stock product.
- [x] Buat `modules/inventory/inventory.service.ts` untuk list movements dan stock adjustment.
- [x] Tambahkan `GET /api/inventory/movements` admin-only dengan `requireRole(request, 'ADMIN')`.
- [x] Support query optional `page`, `limit`, `productId`, dan `type` untuk movement list.
- [x] Tambahkan `POST /api/inventory/adjustments` admin-only dengan `requireRole(request, 'ADMIN')`.
- [x] Izinkan `quantityChange` positif atau negatif, tetapi tolak jika stock akhir negatif.
- [x] Buat `InventoryMovement` type `ADMIN_ADJUSTMENT` berisi `stockBefore`, `stockAfter`, `quantityChange`, `userId`, dan `note`.
- [x] Pastikan movement checkout menyimpan type `ORDER_CHECKOUT`, `quantityChange` negatif, `stockBefore`, `stockAfter`, dan `orderId`.

## 7. Customer UI dan API Client

- [x] Update `lib/customer-api.ts` untuk memakai persistent cart endpoints dan `POST /api/checkout`.
- [x] Update `app/customer/page.tsx` agar cart dibaca dari `GET /api/cart`.
- [x] Update add/update/remove/clear cart di customer page agar memakai endpoint cart database.
- [x] Tambahkan form shipping dan payment untuk checkout.
- [x] Tampilkan error jika payment gagal dan pastikan cart tetap ada.
- [x] Setelah checkout sukses, refresh cart, products, dan orders.

## 8. Admin UI dan API Client

- [x] Update `lib/admin-api.ts` untuk order admin, payment/status update, inventory movements, dan inventory adjustments.
- [x] Update `app/admin/page.tsx` dengan section list all orders.
- [x] Tambahkan kontrol update order status di admin page.
- [x] Tambahkan kontrol update payment status di admin page.
- [x] Tambahkan inventory adjustment form di admin page.
- [x] Tambahkan inventory movement audit list di admin page.

## 9. Dokumentasi dan Agent Instructions

- [x] Buat catatan implementasi di `.opencode/docs/implement/` setelah implementasi selesai.
- [x] Evaluasi dan update `AGENTS.md` karena plan menambah/mengubah endpoint, database/Prisma, auth/security behavior, manual testing, dan verification workflow.
- [x] Catat ringkasan perubahan, file yang diubah, command verifikasi, manual test yang sudah/belum dijalankan, risiko, dan follow-up di implement docs.

## 10. Verifikasi

- [x] Jalankan `npm run prisma:generate`.
- [x] Jalankan `npm run lint`.
- [x] Jalankan `npm run build`.
- [!] Manual test customer: login customer, add cart, refresh/fetch cart ulang, update quantity, checkout `EWALLET` default, verifikasi order dibuat, stock turun, cart kosong, dan audit movement ada. Blocker: manual HTTP/UI test membutuhkan dev server dan database PostgreSQL aktif.
- [!] Manual test customer: checkout dengan `simulatePaymentStatus: FAILED`, verifikasi error, order tidak dibuat, stock tidak turun, dan cart tetap ada. Blocker: manual HTTP/UI test membutuhkan dev server dan database PostgreSQL aktif.
- [!] Manual test customer: checkout `COD`, verifikasi order pending dan stock turun. Blocker: manual HTTP/UI test membutuhkan dev server dan database PostgreSQL aktif.
- [!] Manual test admin: login admin, lihat semua order, update payment status, dan update order status. Blocker: manual HTTP/UI test membutuhkan dev server dan database PostgreSQL aktif.
- [!] Manual test admin: adjustment positif, adjustment negatif valid, adjustment negatif melebihi stock harus gagal, serta stock dan audit movement tercatat. Blocker: manual HTTP/UI test membutuhkan dev server dan database PostgreSQL aktif.

## 11. Follow-up Di Luar Batch Ini

- [ ] Jangan implement cancel order dan restore stock pada batch ini.
- [ ] Jangan implement payment gateway nyata pada batch ini.
- [ ] Jangan implement shipping provider, nomor resi/tracking, perubahan tipe uang, product category/image/SKU/slug/variant, atau automated tests kecuali diminta terpisah.
