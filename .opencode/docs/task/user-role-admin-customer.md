# Task: Menambahkan Role User Admin dan Customer

Source plan: `.opencode/docs/plan/user-role-admin-customer.md`

## Database dan Prisma

- [x] Tambahkan enum Prisma `UserRole` berisi `ADMIN` dan `CUSTOMER` di `prisma/schema.prisma`.
- [x] Tambahkan field `role UserRole @default(CUSTOMER)` pada model `User` di `prisma/schema.prisma`.
- [x] Update `database/create-tables.sql` agar tabel `"User"` memiliki kolom `role` dengan default `'CUSTOMER'`.
- [x] Jika menggunakan migration Prisma, tambahkan migration untuk enum dan kolom `role`.
- [x] Jalankan `npm run prisma:generate` setelah perubahan schema Prisma.

## Seed dan Dokumentasi Project

- [x] Update seed agar user `admin@solutech.test` memiliki `role: 'ADMIN'`.
- [x] Evaluasi penambahan seeded customer `customer@solutech.test` untuk pengujian akses customer sesuai kebutuhan plan.
- [x] Update `AGENTS.md` jika credential seeded berubah atau bertambah.

## Auth Flow dan JWT

- [x] Update repository auth agar query `findUserByEmail()` mengambil field `role` dari Prisma.
- [x] Update type auth seperti `AuthUser` agar memuat `role`.
- [x] Update response login agar user mengembalikan `role` tanpa mengekspos `passwordHash`.
- [x] Update `JwtUser`, `signJwt()`, dan `verifyJwt()` agar JWT membawa `role`.
- [x] Tentukan dan implementasikan perilaku token lama tanpa `role`, antara invalid atau fallback eksplisit sesuai keputusan implementasi.

Keputusan implementasi: token lama tanpa claim `role` dianggap invalid (`401 Invalid token`) sehingga user perlu login ulang setelah perubahan RBAC.

## Authorization Helper

- [x] Pertahankan `requireUser(request)` di `lib/request.ts` untuk autentikasi umum.
- [x] Tambahkan helper authorization berbasis role di `lib/request.ts`, misalnya `requireRole(request, 'ADMIN')` atau `requireAdmin(request)`.
- [x] Pastikan helper authorization mengembalikan HTTP `403` untuk user login dengan role tidak sesuai.
- [x] Pastikan token hilang atau invalid tetap menghasilkan HTTP `401`.

## Aturan Akses Endpoint

- [x] Pastikan `GET /api/products` tetap dapat diakses `ADMIN` dan `CUSTOMER`, serta query product aktif tetap mempertahankan soft delete `deletedAt: null`.
- [x] Pastikan `GET /api/products/:id` tetap dapat diakses `ADMIN` dan `CUSTOMER`, serta query product aktif tetap mempertahankan soft delete `deletedAt: null`.
- [x] Update `POST /api/products` di `app/api/products/route.ts` agar hanya `ADMIN` menggunakan helper authorization role.
- [x] Update `PATCH /api/products/:id` di `app/api/products/[id]/route.ts` agar hanya `ADMIN` menggunakan helper authorization role.
- [x] Update `DELETE /api/products/:id` di `app/api/products/[id]/route.ts` agar hanya `ADMIN` menggunakan helper authorization role dan tetap mempertahankan soft delete.
- [x] Pastikan `GET /api/orders` tetap memakai `requireUser(request)` dan filter data berdasarkan `user.userId`.
- [x] Pastikan `POST /api/orders` tetap memakai `requireUser(request)`, filter berdasarkan `user.userId`, dan menjaga transaction safety untuk stok serta total order.
- [x] Jangan mengubah behavior order admin untuk melihat semua order; jika dibutuhkan, catat sebagai fitur/endpoint terpisah.

## Type dan Layering

- [x] Tambahkan type domain role jika diperlukan, misalnya `type UserRole = 'ADMIN' | 'CUSTOMER'`.
- [x] Tempatkan validasi di `modules/<domain>/*.schema.ts` jika ada perubahan payload/query.
- [x] Tempatkan business logic di `modules/<domain>/*.service.ts` jika ada perubahan aturan domain.
- [x] Tempatkan akses Prisma di `modules/<domain>/*.repository.ts` jika ada perubahan query.
- [x] Pastikan semua penggunaan user dari token dapat membaca `user.role`.

## Verifikasi

- [x] Jalankan `npm run prisma:generate`.
- [x] Jalankan `npm run lint`.
- [x] Jalankan `npm run build` jika perubahan berdampak ke build TypeScript/API.
- [!] Manual test login admin dan pastikan create/update/delete product berhasil.
- [!] Manual test login customer dan pastikan create/update/delete product mendapat HTTP `403`.
- [!] Manual test customer tetap bisa list product dan membuat/list order miliknya.
- [!] Manual test request tanpa token mendapat HTTP `401`.
- [!] Manual test token invalid mendapat HTTP `401`.

Manual API test belum dijalankan karena tidak ada dev server/database aktif yang diverifikasi dalam sesi implementasi ini. Jalankan setelah PostgreSQL tersedia, migration/seed diterapkan, dan server Next.js aktif.
