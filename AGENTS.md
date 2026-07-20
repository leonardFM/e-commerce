# AGENTS.md

Panduan untuk agent yang bekerja di repo ini.

## Project Overview

- Project ini adalah backend e-commerce berbasis Next.js App Router, TypeScript, Prisma, PostgreSQL, Redis, dan JWT auth.
- API utama ada di `app/api/**/route.ts`.
- Logika domain ada di `modules/<domain>/` dengan pola `schema`, `service`, `repository`, dan `types`.
- Helper umum ada di `lib/` (termasuk `lib/token-context.ts` untuk AsyncLocalStorage token context sliding session).
- Database didefinisikan di `prisma/schema.prisma` dan SQL awal di `database/create-tables.sql`.

## Commands

- Install dependency: `npm install`
- Development server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Run tests: `npm run test`
- Run integration tests: `npm run test:integration`
- Run test coverage: `npm run test:coverage`
- Generate Prisma client: `npm run prisma:generate`
- Run Prisma migration dev: `npm run prisma:migrate`
- Seed database: `npm run prisma:seed`
- Prisma Studio: `npm run prisma:studio`
- Start services lokal: `docker compose up -d db adminer redis redisinsight`

## Environment

- Salin `.env.example` ke `.env` untuk menjalankan lokal.
- `DATABASE_URL` wajib untuk Prisma/PostgreSQL.
- `JWT_SECRET` wajib untuk sign dan verify token. Minimal 32 karakter; tidak boleh placeholder `change-me-in-production`.
- `REDIS_URL` opsional untuk cache, rate limit, lock Redis, dan token blacklist; jika tidak diisi, semua helper harus fail-open dan aplikasi tetap berjalan tanpa Redis.
- `LOG_LEVEL` opsional untuk mengatur level structured logger Pino; default `debug` di development dan `info` di environment lain.
- `LOG_DESTINATION` opsional untuk tujuan log Pino; nilai yang didukung minimal `stdout` dan `file`. Gunakan `file` untuk demo/local file logging, dan `stdout` untuk production cloud/container.
- `LOG_FILE_PATH` opsional untuk path file log saat `LOG_DESTINATION=file`; default `logs/app.jsonl`.
- `SLOW_QUERY_THRESHOLD_MS` opsional untuk threshold warning query Prisma lambat; default `100` ms.
- `SLOW_CACHE_THRESHOLD_MS` opsional untuk threshold warning operasi cache lambat; default `50` ms.
- Untuk automated integration test, gunakan PostgreSQL database terpisah seperti `solutech_test`; jangan gunakan database development untuk test yang menjalankan cleanup data.
- `SEED_PASSWORD` opsional untuk kustomisasi password user seed; default `password123`.
- Jangan commit `.env`, secret, token, file dalam `logs/`, atau data kredensial lain.

## Architecture Rules

- Route handler hanya menangani HTTP concern: auth, parsing request/query, validasi Zod, status code, dan response wrapper.
- Validasi input harus ditempatkan di `modules/<domain>/*.schema.ts` menggunakan Zod.
- Business logic ditempatkan di `modules/<domain>/*.service.ts`.
- Akses database ditempatkan di `modules/<domain>/*.repository.ts`.
- Type domain ditempatkan di `modules/<domain>/*.types.ts`.
- Gunakan import alias `@/*` sesuai `tsconfig.json`.
- Response sukses gunakan `success()` dari `lib/response.ts`.
- Error response gunakan `failure()` dan `AppError` untuk status HTTP yang disengaja.
- Application logging gunakan `logger` dari `lib/logger.ts`; hindari `console.log` langsung di app code.
- Saat `LOG_DESTINATION=file`, logger menulis JSON Lines ke `LOG_FILE_PATH` dan tidak mengirim app logs ke stdout/stderr.
- File logging lokal bisa membesar tanpa batas; jika file mode dipakai di VPS/single-instance production, wajib siapkan log rotation eksternal.
- Query performance dan cache performance logs harus memakai structured logger Pino.
- Jangan log raw SQL params, raw cache key, raw Redis key, raw email, payment reference, shipping phone, atau shipping address.
- Jangan log password, JWT token, authorization header, secret, atau data sensitif lain.

## Request Logging

- Next.js 16 secara built-in mencatat setiap request dengan format: `{method} {path} {status} in {duration}ms (next.js: Xms, proxy.ts: Xms, application-code: Xms)`.
- Tidak perlu `middleware.ts` atau custom `proxy.ts` untuk logging request — Next.js sudah menyediakan timing breakdown.
- Error response (AppError/ZodError/unhandled) tetap di-log via Pino di `failure()` di `lib/response.ts` untuk structured logging.
- Body request tidak pernah di-log oleh kode aplikasi.

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
- Input string publik/admin harus dinormalisasi dengan Zod (`trim()` dan batas `max()` yang sesuai domain) untuk mengurangi risiko payload besar dan reflected/stored XSS. Semua string input juga di-sanitize HTML (strip all tags) via `sanitize()` dari `lib/sanitize.ts` yang menggunakan library `sanitize-html`.
- Jangan render HTML dari input user/admin. UI harus tetap memakai JSX text interpolation, bukan `dangerouslySetInnerHTML`, kecuali ada sanitizer/allowlist khusus.
- Pesan error API tidak boleh memantulkan data user/admin-generated seperti nama produk; gunakan pesan generik untuk konflik stok atau validasi bisnis.
- Validation error (Zod) response di `lib/response.ts` sudah disanitasi: hanya mengembalikan `path`, `code`, dan `message`; tidak mengembalikan `received` value.
- JWT access token TTL adalah 10 menit dengan sliding session (di `lib/auth.ts`). Setiap request autentikasi dengan sisa token < 2 menit akan mendapatkan token baru via HttpOnly cookie (`token`). Client API wrapper tidak perlu menyimpan token karena browser otomatis mengirim cookie.
- Password policy: minimal 10 karakter, maksimal 128 karakter (di `modules/auth/auth.schema.ts`).
- Duplicate register mengembalikan `Registration failed` (409) generic untuk mengurangi enumerasi user.
- Login rate limit menggunakan kombinasi email + IP (`x-forwarded-for` atau `x-real-ip`) dan global throttle per IP (20 request/menit). Jika Redis tidak tersedia, rate limit fail-open.
- Register rate limit per IP (3 request/jam). Jika Redis tidak tersedia, rate limit fail-open.
- `requireUser()` di `lib/request.ts` setelah verifikasi JWT melakukan pengecekan ke database bahwa user masih ada dan token tidak di-blacklist. User yang dihapus dari DB mendapat 401; token yang di-logout via `POST /api/auth/logout` langsung di-blacklist via Redis dengan TTL sesuai sisa token.
- Token revocation menggunakan Redis key `token-blacklist:<jti>` dengan TTL otomatis. Jika Redis tidak tersedia, fail-open (semua token dianggap valid).
- Security headers baseline dikonfigurasi di `next.config.mjs`: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Strict-Transport-Security` (production only), `Permissions-Policy`, dan `Content-Security-Policy`.
- CSP aktif dengan:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline'` (nonce strategy belum diimplementasikan — `'unsafe-inline'` diperlukan oleh Next.js inline scripts)
  - `upgrade-insecure-requests` (memaksa HTTPS)
  - `style-src 'self' 'unsafe-inline'` (diperlukan oleh CSS-in-JS / Next.js)
  - `img-src 'self' data:`
  - `frame-ancestors 'none'`
  - `base-uri 'self'`
  - `form-action 'self'`
- `'unsafe-eval'` sudah dihapus dari `script-src`.
- `object-src 'none'` dan `worker-src 'self'` ditambahkan ke CSP.
- Order status mengikuti state machine ketat: PENDING → PAID/PROCESSING → SHIPPED → COMPLETED. Transisi invalid ditolak dengan 409.
- Payment status tidak boleh regress dari PAID ke PENDING; ditolak dengan 409.
- `updateOrderPayment` hanya auto-set status ke PAID jika current status adalah PENDING; PROCESSING/SHIPPED tetap pada statusnya.
- Checkout rate limit: 10 checkout/jam per user+IP. Jika Redis tidak tersedia, fail-open.

## Database And Prisma

- Prisma client diekspor dari `lib/prisma.ts`.
- Redis client diekspor lewat `lib/redis.ts`; helper cache JSON ada di `lib/cache.ts`.
- Model utama: `User`, `Product`, `Cart`, `CartItem`, `Order`, `OrderItem`, dan `InventoryMovement`.
- Product memakai soft delete lewat `deletedAt`; query product aktif harus mempertimbangkan `deletedAt: null`.
- Order creation harus menjaga konsistensi stok dan total dalam transaction.
- Checkout melalui `POST /api/checkout` harus menjaga konsistensi stok, total, order item, inventory movement, dan clear cart dalam transaction.
- Redis tidak boleh menjadi source of truth untuk cart, order, inventory movement, atau stok; PostgreSQL transaction tetap wajib untuk perubahan stok/order.
- Simulasi payment gateway bersifat deterministik; payment gagal harus error tanpa membuat order, tanpa mengurangi stok, dan tanpa menghapus cart.
- Inventory adjustment admin harus mencatat `InventoryMovement` dan tidak boleh membuat stok negatif.
- Jangan mengubah schema Prisma tanpa memperbarui SQL/migration atau instruksi setup terkait jika diperlukan.
- Setelah mengubah `prisma/schema.prisma`, jalankan `npm run prisma:generate`.
- Check constraints (stock >= 0, price >= 0, quantity > 0, shippingCost >= 0, subtotal >= 0, total >= 0) hanya didefinisikan di `database/create-tables.sql`, tidak di Prisma schema. Setelah `prisma db push` atau migration baru, constraint ini harus ditambahkan manual ke database.

## API Conventions

- Gunakan `NextRequest` untuk route yang membutuhkan header, query, atau body.
- Parse query dengan `Object.fromEntries(request.nextUrl.searchParams)` lalu validasi lewat schema.
- Parse body dengan `getJsonBody(request)` dari `lib/request.ts` (membatasi ukuran body hingga 100KB) lalu validasi lewat schema.
- Status create gunakan `success(data, 201)`.
- Validation error ditangani oleh `failure()` sebagai HTTP 400.
- Gunakan HTTP 401 untuk unauthenticated, 403 untuk forbidden/role tidak sesuai, 404 untuk resource tidak ditemukan, dan 409 untuk konflik seperti insufficient stock.

## UI Routes

- `/` adalah storefront/homepage toko online dan mengambil produk unggulan aktif secara server-side dari Prisma.
- `/admin` adalah dashboard overview admin client-side; UI harus menolak user non-`ADMIN`, dan API mutasi admin tetap wajib memakai `requireRole(request, 'ADMIN')`.
- `/admin/products`, `/admin/orders`, dan `/admin/inventory` adalah halaman admin client-side terpisah untuk manajemen produk, order, dan inventory.
- `/register` adalah halaman registrasi customer client-side yang memanggil `POST /api/auth/register`, menyimpan token customer ke localStorage, lalu redirect ke `/customer`.
- `/docs` adalah halaman interaktif dokumentasi API berbasis Swagger UI (client component).
- `/customer` adalah dashboard customer client-side untuk katalog, persistent cart, checkout, dan riwayat order; UI harus menolak user non-`CUSTOMER`.
- Cart customer dipersist di database lewat `Cart` dan `CartItem`; endpoint cart wajib user-scoped memakai `user.userId` dari JWT.

## Existing Endpoints

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/products` (require login)
- `POST /api/products` (admin only)
- `GET /api/products/:id` (require login)
- `PATCH /api/products/:id` (admin only)
- `DELETE /api/products/:id` (admin only)
- `GET /api/cart`
- `DELETE /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`
- `POST /api/checkout`
- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `PATCH /api/admin/orders/:id/payment`
- `GET /api/inventory/movements`
- `POST /api/inventory/adjustments`
- `GET /api/docs` (OpenAPI spec JSON)
- `/docs` (Swagger UI page)

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
- Untuk perubahan Redis/cache/rate limit/lock, jalankan Redis lokal melalui Docker Compose jika memungkinkan dan verifikasi fallback saat `REDIS_URL` tidak dikonfigurasi.
- Untuk perubahan test/API behavior, jalankan `npm run test` atau minimal `npm run test:integration` jika test database tersedia.

## Manual API Testing Notes

- Seeded admin: `admin@solutech.test` / `password123`.
- Seeded customer: `customer@solutech.test` / `password123`.
- Login dulu melalui `POST /api/auth/login`, lalu pakai token untuk endpoint protected.
- Header auth: `Authorization: Bearer <token>`.
- Manual UI smoke test: homepage `/`, admin dashboard `/admin`, admin pages `/admin/products`, `/admin/orders`, `/admin/inventory`, dan customer dashboard `/customer`.
- Verifikasi RBAC UI: customer ditolak dari `/admin`, admin ditolak dari `/customer`.
- Verifikasi customer flow: login customer, lihat katalog, tambah cart, checkout, dan cek riwayat order.
- Verifikasi persistent cart: tambah item, refresh/fetch cart ulang, update quantity, lalu checkout.
- Verifikasi checkout payment simulation: `EWALLET` default paid, `COD` pending, dan `simulatePaymentStatus: FAILED` harus gagal tanpa order/stok/cart berubah.
- Verifikasi admin flow: login admin, create/update/delete product dari dashboard.
- Verifikasi admin order/inventory flow: lihat semua order, update payment/status, buat inventory adjustment positif/negatif valid, dan pastikan adjustment negatif melebihi stok gagal.
- Verifikasi sliding session:
  - Login admin → dapat token dengan TTL 10 menit.
  - Akses endpoint → response tanpa token baru (sisa masih > 2 menit).
  - Akses endpoint saat sisa < 2 menit → response **dengan** `token` baru.
  - Client localStorage terupdate dengan token baru.
  - Tab didiamkan > 10 menit → token expired → request berikutnya dapat 401.
  - Customer flow yang sama.

## Git Safety

- Repo mungkin sedang dirty. Jangan revert perubahan yang tidak dibuat sendiri.
- Jangan menjalankan command destruktif seperti `git reset --hard` atau `git checkout --` kecuali diminta eksplisit.
- Jangan commit, amend, push, atau membuat PR kecuali diminta eksplisit.
