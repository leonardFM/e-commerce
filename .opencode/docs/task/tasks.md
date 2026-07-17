# Solutech Commerce Default Task Backlog

Source plan: default project backlog

Gunakan file ini sebagai entry point default untuk agent `implementer` saat user tidak memberikan task file khusus.

Sebelum implementasi, baca `AGENTS.md` dan gunakan `.opencode/docs/` sebagai referensi. Jika fitur baru mengubah endpoint, command, environment variable, arsitektur, auth/security, database/Prisma, manual testing, atau workflow verifikasi, update `AGENTS.md` dalam task yang sama.

## API Dan Arsitektur

- [ ] Baca referensi terkait di `.opencode/docs/plan/`, `.opencode/docs/task/`, dan `.opencode/docs/implement/` sebelum mengubah domain fitur.
- [ ] Review konsistensi route handler di `app/api/**/route.ts` agar tetap hanya menangani auth, parsing request/query, validasi Zod, status code, dan response wrapper.
- [ ] Pastikan setiap endpoint protected memanggil `requireUser(request)` dan tidak mengambil `userId` dari request body.
- [ ] Pastikan response sukses memakai `success()` dan error memakai `failure()` / `AppError`.
- [ ] Pastikan Prisma query tidak berada langsung di route handler.
- [ ] Update `AGENTS.md` jika perubahan fitur memengaruhi endpoint, arsitektur, command, environment, database, security, atau workflow verifikasi.

## Auth

- [ ] Review `POST /api/auth/login` untuk credential validation, password hashing, JWT signing, dan error message yang tidak membocorkan informasi user.
- [ ] Review `lib/auth.ts` dan `lib/request.ts` untuk bearer token parsing, JWT verification, dan status 401 yang konsisten.
- [ ] Pastikan tidak ada password hash, secret, token, atau `.env` content yang terekspos di response atau log.

## Products

- [ ] Review `GET /api/products` untuk pagination/search/filter aktif dengan `deletedAt: null`.
- [ ] Review `POST /api/products` untuk validasi input, status 201, dan penyimpanan data produk.
- [ ] Review `GET /api/products/:id` agar product soft-deleted tidak dianggap aktif.
- [ ] Review `PATCH /api/products/:id` untuk validasi update parsial dan handling 404.
- [ ] Review `DELETE /api/products/:id` agar tetap memakai soft delete melalui `deletedAt`.

## Orders

- [ ] Review `GET /api/orders` agar hanya mengembalikan order milik user dari JWT.
- [ ] Review `POST /api/orders` agar validasi item benar, duplicate product ID diagregasi, dan deleted product tidak bisa dipesan.
- [ ] Pastikan order creation menghitung total dari harga produk saat transaksi berjalan.
- [ ] Pastikan stock decrement dan order creation berjalan atomik dalam Prisma transaction.
- [ ] Pastikan insufficient stock menghasilkan HTTP 409 dan missing product menghasilkan HTTP 404.

## Database Dan Prisma

- [ ] Review kompatibilitas `prisma/schema.prisma` dengan `database/create-tables.sql`.
- [ ] Review `prisma/seed.js` agar data seed deterministik dan sesuai README.
- [ ] Jika schema Prisma berubah, update SQL/setup terkait dan jalankan `npm run prisma:generate`.

## Admin Frontend Integration

- [ ] Review `lib/admin-api.ts` jika perubahan API memengaruhi admin frontend.
- [ ] Pastikan halaman admin tetap mengikuti response contract API yang ada.

## Verification

- [ ] Jalankan `npm run lint` setelah perubahan TypeScript/API.
- [ ] Jalankan `npm run build` untuk perubahan yang sensitif terhadap build atau kontrak Next.js.
- [ ] Jalankan `npm run prisma:generate` setelah perubahan Prisma schema.
- [ ] Lakukan manual API testing jika database dan dev server tersedia.

## Manual API Testing Checklist

- [ ] Login dengan `admin@solutech.test` / `password123`.
- [ ] Test protected endpoint tanpa token harus menghasilkan 401.
- [ ] Test product create, list, detail, update, dan soft delete.
- [ ] Test order create sukses dengan stock cukup.
- [ ] Test order create gagal dengan stock kurang dan expect 409.
- [ ] Test order list hanya berisi order user yang sedang login.
