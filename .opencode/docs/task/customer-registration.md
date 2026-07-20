# Task: Registrasi Customer Baru

Source plan: `/home/ubuntu/e-commerce-solutech/.opencode/docs/plan/customer-registration.md`

## Auth Schema And Types

- [x] Tambah `registerSchema` di `modules/auth/auth.schema.ts` untuk `email`, `password`, dan optional `name`.
- [x] Normalisasi `email` dengan `trim()` dan lowercase.
- [x] Validasi `password` sesuai kebutuhan registrasi sebelum hashing.
- [x] Normalisasi optional `name` dengan `trim()` dan batas panjang wajar.
- [x] Tambah `RegisterInput` di `modules/auth/auth.types.ts`.

## Auth Repository

- [x] Tambah fungsi repository di `modules/auth/auth.repository.ts` untuk membuat user customer.
- [x] Tetap gunakan `findUserByEmail()` untuk cek email duplikat.
- [x] Pastikan role user baru dipaksa `CUSTOMER` dari repository/service, bukan dari body request.

## Auth Service

- [x] Tambah `registerCustomer(input)` di `modules/auth/auth.service.ts`.
- [x] Cek email existing dan tolak email duplikat dengan HTTP `409`.
- [x] Hash password dengan `bcrypt.hash(password, 10)` sebelum disimpan.
- [x] Buat user dengan role `CUSTOMER`.
- [x] Sign JWT memakai payload yang sama dengan login.
- [x] Return `{ token, user }` dengan format user seperti response login.
- [x] Pastikan body berisi `role: 'ADMIN'` atau role lain tidak dapat membuat user admin.
- [x] Pastikan logging auth tidak menulis raw email atau password; gunakan hash email untuk log auth.
- [x] Pastikan unique constraint email dari Prisma ditangani sebagai konflik `409`, bukan error `500`, termasuk risiko race condition registrasi email sama.

## API Route

- [x] Tambah route handler `POST` di `app/api/auth/register/route.ts`.
- [x] Parse body dengan `await request.json()` lalu validasi lewat `registerSchema`.
- [x] Panggil service `registerCustomer()`.
- [x] Return response sukses dengan `success(data, 201)`.
- [x] Tangani error dengan `failure()` dan context `feature: 'auth_register'`.
- [x] Pastikan input invalid ditolak dengan HTTP `400`.

## Integration Tests

- [x] Update `tests/integration/auth.test.ts` dengan test registrasi customer baru.
- [x] Tambah test token hasil registrasi bisa dipakai ke endpoint protected.
- [x] Tambah test duplicate email return `409`.
- [x] Tambah test body invalid return `400`.
- [x] Tambah test body `role: 'ADMIN'` tetap menghasilkan user `CUSTOMER`.

## Documentation And Project Notes

- [x] Update `AGENTS.md` setelah implementasi dengan menambahkan `POST /api/auth/register` ke daftar Existing Endpoints.
- [x] Buat catatan implementasi di `.opencode/docs/implement/` setelah perubahan selesai.

## Verification

- [x] Jalankan `npm run lint`.
- [x] Jalankan `npm run test -- tests/integration/auth.test.ts` jika runner mendukung file spesifik.
- [x] Jika runner tidak mendukung file spesifik, jalankan `npm run test`. Tidak diperlukan karena runner file spesifik berhasil.
- [ ] Manual endpoint check `POST /api/auth/register` untuk sukses `201`, duplicate email `409`, invalid body `400`, dan body `role: 'ADMIN'` tetap menghasilkan role `CUSTOMER`.
- [x] Manual protected endpoint check memakai token dari response registrasi.
