# Implementasi: Cart Persistence, Checkout, Payment, Order Status, dan Inventory Audit

Tanggal: 2026-07-18

Source task: `.opencode/docs/task/cart-checkout-payment-inventory.md`
Source plan: `.opencode/docs/plan/cart-checkout-payment-inventory-plan.md`

## Ringkasan Perubahan

- Menambahkan persistent cart berbasis database (`Cart`, `CartItem`) dan API cart user-scoped.
- Menambahkan endpoint `POST /api/checkout` untuk checkout dari cart.
- Menambahkan simulasi payment deterministik dengan override `simulatePaymentStatus`.
- Menambahkan order status, payment status, payment reference, dan shipping fields pada order.
- Menambahkan inventory audit (`InventoryMovement`) untuk checkout dan admin stock adjustment.
- Menambahkan admin order management endpoint untuk list order, update status, dan update payment.
- Mengubah customer UI agar cart memakai database dan checkout memakai form shipping/payment.
- Mengubah admin UI agar bisa melihat order, update status/payment, membuat adjustment, dan melihat movement audit.

## File yang Diubah/Ditambah

- `prisma/schema.prisma`
- `database/create-tables.sql`
- `prisma/seed.js`
- `modules/cart/*`
- `modules/checkout/*`
- `modules/payments/*`
- `modules/inventory/*`
- `modules/orders/*`
- `app/api/cart/**/route.ts`
- `app/api/checkout/route.ts`
- `app/api/orders/[id]/route.ts`
- `app/api/admin/orders/**/route.ts`
- `app/api/inventory/**/route.ts`
- `lib/customer-api.ts`
- `lib/admin-api.ts`
- `app/customer/page.tsx`
- `app/admin/page.tsx`
- `AGENTS.md`
- `.opencode/docs/task/cart-checkout-payment-inventory.md`

## Catatan API Contract

- `POST /api/checkout` mengembalikan `{ data: { order, payment } }`.
- Payment gagal memakai `AppError('Payment failed', 402)` sehingga response error tidak membuat order, tidak mengurangi stok, dan cart tetap ada.
- `GET /api/orders` tetap mengembalikan order user login, tetapi shape order bertambah dengan status/payment/shipping/subtotal.
- `POST /api/orders` legacy masih ada untuk kompatibilitas, tetapi checkout baru memakai `POST /api/checkout`.

## Dampak Database/Prisma

- Menambahkan enum `OrderStatus`, `PaymentStatus`, `PaymentMethod`, dan `InventoryMovementType`.
- Menambahkan model `Cart`, `CartItem`, dan `InventoryMovement`.
- Menambahkan field status, payment, shipping, subtotal, dan shippingCost pada `Order`.
- Perlu menjalankan `npm run prisma:generate` dan migrasi/setup database sebelum menjalankan app.

## Verifikasi

Command yang sudah dijalankan:

- `npm run prisma:generate` — sukses.
- `npm run lint` — sukses.
- `npm run build` — sukses.
- Setelah fix review blocker, `npm run lint && npm run build` — sukses.

Review subagent:

- Auth/security review — tidak ada blocker; mencatat legacy `POST /api/orders` sebagai risiko non-blocker karena masih bypass checkout/payment audit.
- Prisma review awal menemukan blocker snapshot inventory checkout stale pada concurrent stock change; sudah diperbaiki dengan exact stock guard dan re-review menyatakan tidak ada blocker.
- Code review awal menemukan blocker urutan payment simulation sebelum validasi cart; sudah diperbaiki dengan validasi cart sebelum simulasi payment dan re-review menyatakan tidak ada blocker.
- Test review memberi daftar manual scenario; manual test belum dijalankan.

Manual test belum dijalankan karena membutuhkan dev server, env, dan database PostgreSQL aktif.

## Risiko dan Follow-up

- Uang masih menggunakan `Float` mengikuti schema lama; follow-up ideal adalah migrasi ke `Int` minor unit atau `Decimal`.
- Cancel order dan restore stock sengaja ditunda.
- Payment gateway nyata, shipping provider, tracking, category/image/SKU/variant, dan automated tests belum masuk batch ini.
