# Plan: Menambahkan Role User Admin dan Customer

## Tujuan

Menambahkan role user `ADMIN` dan `CUSTOMER` untuk membedakan akses admin dan customer pada API e-commerce.

## Scope

- Menambahkan role di model `User`.
- Menyertakan role pada login response dan JWT.
- Menambahkan helper authorization berbasis role.
- Membatasi endpoint product write hanya untuk admin.
- Mempertahankan akses order berdasarkan user yang sedang login.

## Rencana Implementasi

### 1. Tambahkan role di database

- Tambahkan enum Prisma `UserRole` dengan nilai `ADMIN` dan `CUSTOMER`.
- Tambahkan field `role UserRole @default(CUSTOMER)` di model `User`.
- Update `database/create-tables.sql` agar tabel `"User"` memiliki kolom `role` dengan default `'CUSTOMER'`.
- Jika project memakai migration Prisma, buat migration untuk enum dan kolom role.

### 2. Update seed data

- Set seeded user `admin@solutech.test` menjadi `role: 'ADMIN'`.
- Opsional: tambah seeded customer seperti `customer@solutech.test` untuk pengujian akses customer.
- Update `AGENTS.md` jika credential seeded berubah atau bertambah.

### 3. Masukkan role ke auth flow

- Update query `findUserByEmail()` agar role tersedia dari Prisma.
- Update type `AuthUser` dan response login agar user mengembalikan `role`.
- Update `JwtUser`, `signJwt()`, dan `verifyJwt()` supaya JWT membawa `role`.
- Tentukan perilaku token lama tanpa role, apakah dianggap invalid atau diberi fallback eksplisit.

### 4. Tambahkan helper authorization

- Pertahankan `requireUser(request)` untuk autentikasi umum.
- Tambahkan helper minimal seperti `requireRole(request, 'ADMIN')` atau `requireAdmin(request)` di `lib/request.ts`.
- Helper authorization harus mengembalikan HTTP `403` jika user login tetapi role tidak sesuai.
- Tetap gunakan HTTP `401` untuk token hilang atau invalid.

### 5. Terapkan aturan akses endpoint

- `GET /api/products` dan `GET /api/products/:id` dapat diakses oleh `ADMIN` dan `CUSTOMER`.
- `POST /api/products`, `PATCH /api/products/:id`, dan `DELETE /api/products/:id` hanya dapat diakses oleh `ADMIN`.
- `GET /api/orders` dan `POST /api/orders` tetap menggunakan `requireUser(request)` dan filter berdasarkan `user.userId`.
- Jika admin perlu melihat semua order, buat endpoint atau fitur terpisah agar behavior customer tidak berubah diam-diam.

### 6. Update type dan response

- Tambahkan type domain role jika diperlukan, misalnya `type UserRole = 'ADMIN' | 'CUSTOMER'`.
- Pastikan response login tidak mengekspos `passwordHash`.
- Pastikan semua penggunaan user dari token dapat membaca `user.role`.

### 7. Verifikasi

- Jalankan `npm run prisma:generate` setelah perubahan Prisma.
- Jalankan `npm run lint`.
- Jalankan `npm run build` jika perubahan berdampak ke build TypeScript/API.
- Manual test login admin dan customer.

## Skenario Manual Test

- Login sebagai admin, lalu create/update/delete product harus berhasil.
- Login sebagai customer, lalu create/update/delete product harus mendapat HTTP `403`.
- Customer tetap bisa list product dan membuat/list order miliknya.
- Request tanpa token tetap mendapat HTTP `401`.
- Token invalid tetap mendapat HTTP `401`.

## Aturan Akses Awal

- `ADMIN`: boleh CRUD products dan akses orders miliknya.
- `CUSTOMER`: boleh melihat products dan membuat/list orders miliknya.
- Product write hanya untuk `ADMIN`.
