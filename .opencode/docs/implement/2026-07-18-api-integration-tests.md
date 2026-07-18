# Implementasi: Automated API Integration Tests

Tanggal: 2026-07-18

Source task: `.opencode/docs/task/api-integration-test.md`
Source plan: `.opencode/docs/plan/api-integration-test-plan.md`

## Ringkasan Perubahan

- Menambahkan Vitest dan coverage provider untuk automated tests.
- Menambahkan script test di `package.json`.
- Menambahkan `vitest.config.ts` untuk test environment Node.
- Menambahkan helper database, fixtures, dan route API caller.
- Menambahkan integration tests untuk auth/RBAC, persistent cart, checkout transaction, orders, dan inventory audit.
- Memperbaiki handling invalid JWT agar protected endpoint mengembalikan `401` bukan `500`.

## File yang Diubah/Ditambah

- `package.json`
- `package-lock.json`
- `vitest.config.ts`
- `tests/helpers/db.ts`
- `tests/helpers/fixtures.ts`
- `tests/helpers/api.ts`
- `tests/integration/auth.test.ts`
- `tests/integration/products.test.ts`
- `tests/integration/cart.test.ts`
- `tests/integration/checkout.test.ts`
- `tests/integration/orders.test.ts`
- `tests/integration/inventory.test.ts`
- `lib/request.ts`
- `.env.example`
- `AGENTS.md`
- `.opencode/docs/task/api-integration-test.md`

## Coverage Implemented

- Login admin/customer dan invalid credential.
- Protected endpoint tanpa/invalid token.
- Customer ditolak dari admin endpoint.
- Product list/search/pagination, admin create/update/soft-delete, customer forbidden, dan invalid product body.
- Cart persistence: add, increment, fetch ulang, update, delete item, clear cart, stock guard, dan user scoping.
- Checkout `EWALLET` sukses: order, stock decrement, cart clear, dan inventory movement.
- Checkout `COD` pending dan stock reserved.
- Payment `FAILED`: tidak membuat order, tidak menurunkan stok, cart tetap, dan movement tidak dibuat.
- Insufficient stock: rollback tanpa order/movement.
- Customer order list/detail user-scoped.
- Admin order list, update payment, update status, dan completed order regression guard.
- Inventory movement list/filter dan admin adjustment positif/negatif/failure.

## Verifikasi

Command yang dijalankan:

- `npm run test` — sukses, 21 tests passed.
- `npm run test:integration` — sukses, 21 tests passed.
- `npm run lint` — sukses.
- `npm run build` — sukses.

Catatan:

- Test integration melakukan cleanup database dengan `TRUNCATE ... RESTART IDENTITY CASCADE`; script test default memakai `solutech_test` dan helper menolak reset database yang path-nya tidak mengandung `test`.

## Risiko dan Follow-up

- Test saat ini memanggil route handler langsung, belum HTTP server-level test dengan `supertest` atau dev server.
- Product integration suite dasar sudah dibuat; coverage lanjutan bisa menambah malformed path param dan edge case lain.
- Concurrency checkout test belum dibuat karena berpotensi flaky dan disarankan sebagai phase lanjutan.
- Unit tests untuk payment mapping/schema/status transition bisa ditambahkan setelah integration suite stabil.
