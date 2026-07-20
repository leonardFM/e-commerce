# Plan: Registrasi Customer Baru

## Tujuan

Menambahkan flow registrasi customer baru melalui API. Registrasi yang berhasil langsung mengembalikan token login agar customer dapat memakai endpoint protected tanpa login terpisah.

## Endpoint

- `POST /api/auth/register`

## Request Body

```json
{
  "email": "customer@example.com",
  "password": "password123",
  "name": "Customer Name"
}
```

## Response Sukses

- Status: `201`
- Format response mengikuti login:

```json
{
  "data": {
    "token": "...",
    "user": {
      "id": 1,
      "email": "customer@example.com",
      "name": "Customer Name",
      "role": "CUSTOMER"
    }
  }
}
```

## Perilaku Utama

- `email` dinormalisasi dengan `trim()` dan lowercase.
- `password` divalidasi lalu di-hash sebelum disimpan.
- `name` optional, dinormalisasi dengan `trim()` dan batas panjang wajar.
- Role selalu dipaksa menjadi `CUSTOMER` dari service/repository, bukan dari body request.
- Body berisi `role: 'ADMIN'` atau role lain tidak boleh membuat user admin.
- Email duplikat ditolak dengan HTTP `409`.
- Input invalid ditolak dengan HTTP `400`.
- Registrasi sukses langsung membuat JWT memakai payload yang sama dengan login.
- Logging tidak boleh menulis raw email atau password; gunakan hash email untuk log auth.

## Perubahan File

- `app/api/auth/register/route.ts`
  - Tambah route handler `POST`.
  - Parse body dengan schema registrasi.
  - Return `success(data, 201)`.
  - Tangani error dengan `failure()` dan context `feature: 'auth_register'`.

- `modules/auth/auth.schema.ts`
  - Tambah `registerSchema`.
  - Validasi `email`, `password`, dan optional `name`.

- `modules/auth/auth.types.ts`
  - Tambah `RegisterInput`.

- `modules/auth/auth.repository.ts`
  - Tambah fungsi create user customer.
  - Tetap gunakan `findUserByEmail()` untuk cek email duplikat.

- `modules/auth/auth.service.ts`
  - Tambah `registerCustomer(input)`.
  - Cek email existing.
  - Hash password dengan `bcrypt.hash(password, 10)`.
  - Buat user role `CUSTOMER`.
  - Sign JWT dan return `{ token, user }`.

- `tests/integration/auth.test.ts`
  - Tambah test registrasi customer baru.
  - Tambah test token hasil registrasi bisa dipakai ke endpoint protected.
  - Tambah test duplicate email return `409`.
  - Tambah test body invalid return `400`.
  - Tambah test body `role: 'ADMIN'` tetap menghasilkan user `CUSTOMER`.

- `AGENTS.md`
  - Tambah `POST /api/auth/register` ke daftar Existing Endpoints setelah implementasi.

- `.opencode/docs/implement/`
  - Tambah catatan implementasi setelah perubahan selesai.

## Langkah Implementasi

1. Tambah schema dan type registrasi di module auth.
2. Tambah fungsi repository untuk membuat customer user.
3. Tambah service `registerCustomer()` dengan validasi bisnis, hash password, create user, sign JWT, dan logging aman.
4. Tambah route `POST /api/auth/register`.
5. Tambah integration tests untuk skenario sukses dan error.
6. Update `AGENTS.md` jika endpoint sudah diimplementasikan.
7. Buat catatan implementasi di `.opencode/docs/implement/`.

## Verifikasi

- Jalankan `npm run lint`.
- Jalankan test auth, jika runner mendukung file spesifik:

```bash
npm run test -- tests/integration/auth.test.ts
```

- Jika tidak mendukung file spesifik, jalankan:

```bash
npm run test
```

## Risiko Dan Follow-Up

- Perlu memastikan unique constraint email dari Prisma tetap ditangani sebagai konflik `409`, bukan error `500`, terutama jika ada race condition dua registrasi email sama secara bersamaan.
- Rate limit registrasi belum direncanakan pada tahap ini; dapat ditambahkan nanti jika endpoint terbuka publik mulai dipakai intensif.
