# Implementasi: User Role Admin dan Customer

Source plan: `.opencode/docs/plan/user-role-admin-customer.md`
Source task: `.opencode/docs/task/user-role-admin-customer.md`

## Ringkasan

Menambahkan RBAC sederhana untuk membedakan user `ADMIN` dan `CUSTOMER`.

- User sekarang memiliki field `role` dengan nilai `ADMIN` atau `CUSTOMER`.
- JWT membawa claim `role`.
- Response login mengembalikan `user.role`.
- Product write hanya dapat dilakukan oleh `ADMIN`.
- Product read dan order tetap membutuhkan user login.
- Order tetap user-scoped berdasarkan `user.userId` dari token.

## Perubahan Database dan Prisma

- Menambahkan enum Prisma `UserRole` di `prisma/schema.prisma`.
- Menambahkan field `role UserRole @default(CUSTOMER)` pada model `User`.
- Menambahkan enum PostgreSQL dan kolom `role` di `database/create-tables.sql`.
- Menambahkan migration SQL baseline di `prisma/migrations/20260717000000_add_user_role/migration.sql` agar shadow database Prisma dapat membuat tabel awal beserta role.
- Menjalankan `npm run prisma:generate` setelah perubahan schema.

## Perubahan Auth dan Authorization

- `lib/auth.ts`:
  - `JwtUser` sekarang memuat `role`.
  - `signJwt()` menulis claim `role`.
  - `verifyJwt()` memvalidasi claim `role` hanya boleh `ADMIN` atau `CUSTOMER`.
- `lib/request.ts`:
  - `requireUser(request)` tetap untuk endpoint protected umum.
  - Menambahkan `requireRole(request, role)` untuk endpoint berbasis role.
  - User login dengan role tidak sesuai mendapat HTTP `403`.
- Token lama tanpa claim `role` dianggap invalid dan perlu login ulang.

## Perubahan Endpoint

- `GET /api/products` tetap protected untuk `ADMIN` dan `CUSTOMER`.
- `GET /api/products/:id` tetap protected untuk `ADMIN` dan `CUSTOMER`.
- `POST /api/products` sekarang membutuhkan role `ADMIN`.
- `PATCH /api/products/:id` sekarang membutuhkan role `ADMIN`.
- `DELETE /api/products/:id` sekarang membutuhkan role `ADMIN`.
- `GET /api/orders` tetap memakai `requireUser(request)` dan filter order berdasarkan `user.userId`.
- `POST /api/orders` tetap memakai `requireUser(request)` dan membuat order untuk `user.userId` dari token.

## Perubahan Seed dan Dokumentasi

- `prisma/seed.js` sekarang membuat seeded admin:
  - `admin@solutech.test` / `password123`
- `prisma/seed.js` sekarang membuat seeded customer:
  - `customer@solutech.test` / `password123`
- `AGENTS.md` diupdate untuk mencatat helper `requireRole`, HTTP `403`, dan credential seeded admin/customer.

## File yang Diubah

- `prisma/schema.prisma`
- `prisma/migrations/20260717000000_add_user_role/migration.sql`
- `database/create-tables.sql`
- `prisma/seed.js`
- `lib/auth.ts`
- `lib/request.ts`
- `modules/auth/auth.service.ts`
- `modules/auth/auth.types.ts`
- `app/api/products/route.ts`
- `app/api/products/[id]/route.ts`
- `AGENTS.md`
- `.opencode/docs/task/user-role-admin-customer.md`

## Verifikasi yang Sudah Dijalankan

- `npm run prisma:generate`: sukses.
- `npm run lint`: sukses.
- `npm run build`: sukses.

## Perbaikan Migration

Setelah `npm run prisma:migrate` memunculkan error `P3006/P1014` karena shadow database belum memiliki tabel `"User"`, migration diperbarui menjadi baseline schema lengkap.

Migration sekarang membuat:

- enum `"UserRole"`
- tabel `"User"`
- tabel `"Product"`
- tabel `"Order"`
- tabel `"OrderItem"`
- relasi foreign key order dan order item
- kolom `User.role` dengan default `CUSTOMER`

## Status Verifikasi Migration Terbaru

- `npm run prisma:migrate` tidak lagi berhenti pada error shadow database `P3006/P1014`.
- Command sekarang berhenti karena Prisma mendeteksi drift: database lokal sudah memiliki tabel `User`, `Product`, `Order`, dan `OrderItem`, tetapi migration history belum mencatat baseline tersebut.
- Reset database tidak dijalankan karena `prisma migrate reset` bersifat destruktif dan akan menghapus data.
- Untuk database lokal/dev yang datanya boleh dihapus, jalankan `prisma migrate reset` lalu seed ulang.
- Untuk database yang datanya ingin dipertahankan, lakukan baseline migration dengan menandai migration baseline sebagai applied memakai `prisma migrate resolve --applied 20260717000000_add_user_role`, lalu pastikan kolom `role` sudah ada di tabel `"User"`.

Verifikasi setelah perbaikan migration:

- `npm run prisma:generate`: sukses.
- `npm run lint`: sukses.

## Manual Test yang Belum Dijalankan

Manual API test belum dijalankan karena dev server dan database aktif tidak diverifikasi pada sesi implementasi.

Skenario yang perlu diuji setelah PostgreSQL, migration/seed, dan Next server aktif:

- Login admin mengembalikan `data.user.role = "ADMIN"`.
- Login customer mengembalikan `data.user.role = "CUSTOMER"`.
- Admin dapat create/update/delete product.
- Customer mendapat HTTP `403` saat create/update/delete product.
- Admin dan customer dapat list/detail product dengan token valid.
- Customer dapat membuat dan melihat order miliknya.
- Request tanpa token mendapat HTTP `401`.
- Token invalid mendapat HTTP `401`.
- Token lama tanpa claim `role` mendapat HTTP `401` dan user perlu login ulang.

## Catatan Risiko

- Database yang sudah ada perlu menjalankan migration agar enum `UserRole` dan kolom `User.role` tersedia.
- Perubahan JWT bersifat breaking untuk token lama karena role sekarang wajib ada di token.
- Seed menghapus data sebelum membuat data awal, sehingga hanya aman untuk lingkungan lokal/dev.
