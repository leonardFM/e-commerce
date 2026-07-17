# AGENTS.md

Panduan untuk agent yang bekerja di repo ini.

## Project Overview

- Project ini adalah backend e-commerce berbasis Next.js App Router, TypeScript, Prisma, PostgreSQL, dan JWT auth.
- API utama ada di `app/api/**/route.ts`.
- Logika domain ada di `modules/<domain>/` dengan pola `schema`, `service`, `repository`, dan `types`.
- Helper umum ada di `lib/`.
- Database didefinisikan di `prisma/schema.prisma` dan SQL awal di `database/create-tables.sql`.

## Commands

- Install dependency: `npm install`
- Development server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Generate Prisma client: `npm run prisma:generate`
- Run Prisma migration dev: `npm run prisma:migrate`
- Seed database: `npm run prisma:seed`
- Prisma Studio: `npm run prisma:studio`
- Start services lokal: `docker compose up -d db adminer redis redisinsight`

## Environment

- Salin `.env.example` ke `.env` untuk menjalankan lokal.
- `DATABASE_URL` wajib untuk Prisma/PostgreSQL.
- `JWT_SECRET` wajib untuk sign dan verify token.
- Jangan commit `.env`, secret, token, atau data kredensial lain.

## Architecture Rules

- Route handler hanya menangani HTTP concern: auth, parsing request/query, validasi Zod, status code, dan response wrapper.
- Validasi input harus ditempatkan di `modules/<domain>/*.schema.ts` menggunakan Zod.
- Business logic ditempatkan di `modules/<domain>/*.service.ts`.
- Akses database ditempatkan di `modules/<domain>/*.repository.ts`.
- Type domain ditempatkan di `modules/<domain>/*.types.ts`.
- Gunakan import alias `@/*` sesuai `tsconfig.json`.
- Response sukses gunakan `success()` dari `lib/response.ts`.
- Error response gunakan `failure()` dan `AppError` untuk status HTTP yang disengaja.

## Docs Workflow

- Gunakan `.opencode/docs/` sebagai referensi project untuk plan, task, dan catatan implementasi.
- Plan fitur ditempatkan di `.opencode/docs/plan/`.
- Task backlog ditempatkan di `.opencode/docs/task/`.
- Catatan implementasi ditempatkan di `.opencode/docs/implement/`.
- Sebelum implementasi, baca dokumen terkait domain/fitur yang sedang disentuh jika tersedia.
- Setelah implementasi fitur/perubahan selesai, buat atau update catatan implementasi di `.opencode/docs/implement/` dengan ringkasan perubahan, file yang diubah, verifikasi yang dijalankan, manual test yang belum dijalankan, dan risiko/follow-up.
- Setiap penambahan atau perubahan fitur harus mengevaluasi apakah `AGENTS.md` perlu diupdate.
- Update `AGENTS.md` jika perubahan memengaruhi endpoint, command, environment variable, arsitektur, auth/security, database/Prisma, manual testing, atau workflow verifikasi.

## Auth And Security

- Endpoint protected harus memanggil `requireUser(request)` dari `lib/request.ts`.
- Endpoint khusus admin harus memanggil `requireRole(request, 'ADMIN')` dari `lib/request.ts`.
- JWT dikirim dengan header `Authorization: Bearer <token>`.
- Jangan menaruh secret langsung di source code.
- Untuk data user-scoped, selalu filter berdasarkan `user.userId` dari token, bukan dari body request.
- Endpoint login ada di `POST /api/auth/login`.

## Database And Prisma

- Prisma client diekspor dari `lib/prisma.ts`.
- Model utama: `User`, `Product`, `Order`, dan `OrderItem`.
- Product memakai soft delete lewat `deletedAt`; query product aktif harus mempertimbangkan `deletedAt: null`.
- Order creation harus menjaga konsistensi stok dan total dalam transaction.
- Jangan mengubah schema Prisma tanpa memperbarui SQL/migration atau instruksi setup terkait jika diperlukan.
- Setelah mengubah `prisma/schema.prisma`, jalankan `npm run prisma:generate`.

## API Conventions

- Gunakan `NextRequest` untuk route yang membutuhkan header, query, atau body.
- Parse query dengan `Object.fromEntries(request.nextUrl.searchParams)` lalu validasi lewat schema.
- Parse body dengan `await request.json()` lalu validasi lewat schema.
- Status create gunakan `success(data, 201)`.
- Validation error ditangani oleh `failure()` sebagai HTTP 400.
- Gunakan HTTP 401 untuk unauthenticated, 403 untuk forbidden/role tidak sesuai, 404 untuk resource tidak ditemukan, dan 409 untuk konflik seperti insufficient stock.

## Existing Endpoints

- `POST /api/auth/login`
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/orders`
- `POST /api/orders`

## Code Style

- TypeScript strict mode aktif.
- Ikuti style file yang ada: single quotes, tanpa semicolon, dan fungsi async eksplisit.
- Buat perubahan sekecil mungkin yang menyelesaikan masalah.
- Jangan menambah abstraction baru kecuali benar-benar dipakai ulang atau memperjelas domain.
- Jangan mengedit output build seperti `.next/`.
- Jangan memformat ulang file besar yang tidak terkait perubahan.

## Verification

- Untuk perubahan TypeScript/API, minimal jalankan `npm run lint` jika memungkinkan.
- Untuk perubahan build-sensitive, jalankan `npm run build` jika memungkinkan.
- Untuk perubahan Prisma, jalankan `npm run prisma:generate` dan verifikasi query terkait.
- Untuk perubahan endpoint, uji manual dengan HTTP client jika server dan database tersedia.

## Manual API Testing Notes

- Seeded admin: `admin@solutech.test` / `password123`.
- Seeded customer: `customer@solutech.test` / `password123`.
- Login dulu melalui `POST /api/auth/login`, lalu pakai token untuk endpoint protected.
- Header auth: `Authorization: Bearer <token>`.

## Git Safety

- Repo mungkin sedang dirty. Jangan revert perubahan yang tidak dibuat sendiri.
- Jangan menjalankan command destruktif seperti `git reset --hard` atau `git checkout --` kecuali diminta eksplisit.
- Jangan commit, amend, push, atau membuat PR kecuali diminta eksplisit.
