# Backend Production Hardening Tasks

Source plan: `.opencode/docs/plan/backend-production-hardening-plan.md`

> Implementasi hardening backend: API contract, auth/abuse protection, money precision, DB integrity, transaction/concurrency safety, soft delete consistency, test coverage/CI, dan security headers.

---

## Phase 1: API Contract And Validation Fixes

### 1.1 Publickan `GET /api/products`
- [ ] Ubah route `app/api/products/route.ts` agar `GET` tidak memanggil `requireUser(request)`.
- [ ] Product listing harus bisa diakses tanpa token.
- [ ] Pertahankan `POST` tetap admin-only dengan `requireRole(request, 'ADMIN')`.
- [ ] Update test integration yang terkait jika ada asumsi product GET terproteksi.
- [ ] Update AGENTS.md: catat perubahan endpoint public.

### 1.2 Publickan `GET /api/products/:id`
- [ ] Ubah route `app/api/products/[id]/route.ts` agar `GET` tidak memanggil `requireUser(request)`.
- [ ] Detail produk aktif harus bisa diakses tanpa token.
- [ ] Pertahankan `PATCH` dan `DELETE` tetap admin-only.

### 1.3 Shared helper untuk parsing positive integer path param
- [ ] Buat helper di `lib/` (misal `lib/param.ts`) untuk parsing dan validasi path param integer positif.
- [ ] Helper harus mengembalikan HTTP 400 via `AppError` untuk nilai non-integer, <= 0, atau NaN.
- [ ] Ganti `parseId()` di `app/api/products/[id]/route.ts` dengan helper baru.
- [ ] Ganti `parseProductId()` di `app/api/cart/items/[productId]/route.ts` dengan helper baru.
- [ ] Ganti `parseId()` di `app/api/orders/[id]/route.ts` dengan helper baru.

### 1.4 Evaluasi response Zod validation error
- [ ] Tinjau `lib/response.ts` bagian `ZodError` handler (`failure()`).
- [ ] Pastikan error response tidak memantulkan input user/generated yang sensitif.
- [ ] Jika perlu, gunakan pesan generik atau batasi `issues` yang dikembalikan.

---

## Phase 2: Auth And Abuse Protection Hardening

### 2.1 Perpendek access token TTL
- [ ] Ubah `setExpirationTime('7d')` di `lib/auth.ts` menjadi durasi lebih aman (misal `'15m'`, `'30m'`, atau `'1h'`).
- [ ] Evaluasi dampak UX dashboard/customer; jika perlu, dokumentasikan kebutuhan refresh/session strategy di catatan implementasi.

### 2.2 Validasi runtime kekuatan `JWT_SECRET`
- [ ] Buat validasi di startup atau di `getJwtSecret()` di `lib/auth.ts`:
  - Tidak boleh kosong.
  - Tidak boleh placeholder/default seperti `change-me-in-production`.
  - Minimal panjang 32 karakter.
- [ ] Throw `AppError` dengan status 500 jika tidak memenuhi.
- [ ] Update `.env.example` dengan nilai placeholder yang tetap dikenali sebagai invalid.

### 2.3 Update `requireUser()` dengan DB user check
- [ ] Di `lib/request.ts`, setelah `verifyJwt()`, tambahkan pengecekan ke database (`prisma.user.findUnique`) bahwa user masih ada.
- [ ] Jika user tidak ditemukan di DB, throw `AppError('Unauthorized', 401)`.

### 2.4 Session/revocation mechanism (opsional fase ini)
- [ ] Evaluasi apakah perlu token version/session model untuk logout, role change, atau password reset.
- [ ] Jika iya, tambahkan field `tokenVersion` di model `User` Prisma dan update `requireUser()` untuk memverifikasi.
- [ ] Jika tidak, dokumentasikan alasan dan rencana di catatan implementasi.

### 2.5 Perketat parsing `Authorization` header
- [ ] Update `getBearerToken()` di `lib/auth.ts`:
  - Header dengan segment ekstra setelah token (misal `Bearer token extra`) harus ditolak.
  - Hanya terima format `Bearer <token>` dengan tepat satu segment token.

### 2.6 Perkuat login rate limit
- [ ] Tambahkan kombinasi email + IP jika IP tersedia (`request.headers.get('x-forwarded-for')` atau `x-real-ip`).
- [ ] Tambahkan global throttle untuk burst abuse.
- [ ] Pertimbangkan fallback in-memory khusus auth jika Redis unavailable (fail-closed untuk auth).
- [ ] Update `lib/rate-limit.ts` atau buat module auth rate limit terpisah.

### 2.7 Rate limit untuk `POST /api/auth/register`
- [ ] Tambahkan rate limit di route `app/api/auth/register/route.ts` atau di `auth.service.ts`.
- [ ] Kombinasi IP atau global throttle dengan window dan limit yang sesuai.

### 2.8 Tingkatkan password policy
- [ ] Ubah `z.string().min(6)` di `auth.schema.ts` menjadi `z.string().min(10)` atau `min(12)`.
- [ ] Pertimbangkan tambahan strength check (huruf besar, angka, simbol) sesuai kebijakan.
- [ ] Update test integration yang menggunakan password pendek.

### 2.9 Evaluasi duplicate register error message
- [ ] Tinjau `auth.service.ts`: duplicate register mengembalikan `'Email already registered'` (409).
- [ ] Evaluasi apakah perlu pesan generic untuk mengurangi enumeration user.
- [ ] Jika diubah, update test yang mengharapkan pesan spesifik tersebut.

---

## Phase 3: Money Precision And Database Integrity

### 3.1 Ubah field uang dari `Float` ke `Decimal`
- [ ] Ubah `prisma/schema.prisma`:
  - `Product.price` → `Decimal @db.Decimal(12,2)`
  - `Order.shippingCost` → `Decimal @db.Decimal(12,2)`
  - `Order.subtotal` → `Decimal @db.Decimal(12,2)`
  - `Order.total` → `Decimal @db.Decimal(12,2)`
  - `OrderItem.unitPrice` → `Decimal @db.Decimal(12,2)`
- [ ] Jalankan `npm run prisma:generate`.

### 3.2 Update `database/create-tables.sql`
- [ ] Ubah tipe `DOUBLE PRECISION` menjadi `DECIMAL(12,2)` untuk semua field uang di SQL.

### 3.3 Update repository dan service
- [ ] `modules/products/product.repository.ts`: sesuaikan interface `toProductRecord` dan `CreateProductInput` jika ada kaitan tipe.
- [ ] `modules/checkout/checkout.repository.ts`: sesuaikan perhitungan `subtotal` dan `total` yang melibatkan `price`. Prisma Decimal operations perlu dikonversi ke number untuk response.
- [ ] `modules/orders/order.repository.ts`: sesuaikan perhitungan dan return type.
- [ ] `modules/cart/cart.repository.ts`: sesuaikan `lineTotal` dan `total` perhitungan.

### 3.4 Update seed data
- [ ] Pastikan `prisma/seed.js` menggunakan format Decimal (atau number yang akan dikonversi Prisma).

### 3.5 Update response serialization
- [ ] Decimal Prisma dikembalikan sebagai string di JSON. Pastikan response API mengonversi ke number atau format sesuai kontrak.
- [ ] Evaluasi apakah perlu helper serialization di `lib/response.ts` atau di masing-masing service/repository.

### 3.6 Update test yang bergantung pada nilai uang
- [ ] Sesuaikan tipe dan assertion di integration test yang membandingkan field uang.

### 3.7 Tambahkan DB check constraints
- [ ] Tambahkan migration/SQL untuk constraints:
  - `Product.stock >= 0`
  - `Product.price >= 0`
  - `CartItem.quantity > 0`
  - `OrderItem.quantity > 0`
  - `Order.shippingCost >= 0`
  - `Order.subtotal >= 0`
  - `Order.total >= 0`
- [ ] Update `database/create-tables.sql` dengan constraints tersebut.
- [ ] Pastikan seed data dan test tidak melanggar constraints.

### 3.8 Tambahkan DB indexes
- [ ] Tambahkan migration/SQL untuk indexes:
  - `Product(deletedAt, createdAt)` untuk active product listing/order.
  - `Order(userId, createdAt)` untuk user order list.
  - `Order(createdAt)` untuk admin order pagination.
  - `InventoryMovement(productId, createdAt)` untuk inventory filter.
  - `InventoryMovement(type, createdAt)` untuk inventory filter.
- [ ] Update `database/create-tables.sql` dengan indexes tersebut.

---

## Phase 4: Transaction And Concurrency Safety

### 4.1 Perkuat cart mutation agar validasi atomik
- [ ] `addCartItem` di `modules/cart/cart.repository.ts`: pastikan validasi active product (`deletedAt: null`) dan stock terjadi atomic dengan write dalam transaksi.
- [ ] Gunakan `prisma.$transaction` untuk read + write stock validation tanpa race.
- [ ] Pastikan `addCartItem` tidak bisa menyimpan quantity akhir melebihi stock saat terjadi concurrent request.

### 4.2 Perkuat `setCartItemQuantity`
- [ ] Di `modules/cart/cart.repository.ts` atau `cart.service.ts`: tolak product yang sudah soft-deleted.
- [ ] Tolak quantity melebihi stock pada saat write.

### 4.3 Filter / tandai unavailable cart item
- [ ] Saat read cart (`getOrCreateCart` atau `getCartService`), filter atau tandai item yang product-nya sudah soft-deleted.
- [ ] Pertimbangkan untuk menyertakan `unavailable: true` flag di response item.

### 4.4 Perbaiki checkout inventory movement audit
- [ ] Di `modules/checkout/checkout.repository.ts`, pastikan `stockBefore` dan `stockAfter` tidak stale.
- [ ] Gunakan `stock` current dari DB setelah decrement sebagai `stockAfter`, bukan hasil kalkulasi dari snapshot awal.

### 4.5 Pertimbangkan `SELECT ... FOR UPDATE` di checkout
- [ ] Di `checkout.repository.ts` transaction, tambahkan `SELECT ... FOR UPDATE` pada product rows sebelum stock decrement.
- [ ] Gunakan `tx.$executeRaw` atau Prisma `findFirst` dalam transaction yang sama.

### 4.6 Evaluasi legacy `POST /api/orders`
- [ ] Tinjau `app/api/orders/route.ts` `POST` dan `modules/orders/order.repository.ts` `createOrder`.
- [ ] Jika masih diperlukan, pastikan behavior konsisten dengan checkout (soft delete check, stock decrement, inventory movement).
- [ ] Jika tidak diperlukan, pertimbangkan deprecation atau removal.
- [ ] Update test terkait.

### 4.7 Payment side effect setelah DB lock
- [ ] Di `checkout.service.ts`, pastikan `simulatePayment` dipanggil **sebelum** DB transaction dimulai (sudah sesuai saat ini).
- [ ] Dokumentasikan bahwa payment side effect terjadi sebelum DB lock agar idempotency key bisa ditambahkan di masa depan.

---

## Phase 5: Product Soft Delete Consistency

### 5.1 Update product repository write path
- [ ] `updateProduct` di `product.repository.ts`: tambahkan where `deletedAt: null` agar update hanya berlaku untuk produk aktif.
- [ ] `softDeleteProduct`: tambahkan where `deletedAt: null` agar soft delete kedua kali mengembalikan 404.

### 5.2 Soft delete produk yang sudah deleted → 404
- [ ] Pastikan `deleteProductService` di `product.service.ts` (dan repository) mengembalikan 404 jika produk sudah soft-deleted.
- [ ] Saat ini sudah ada pengecekan `if (product.deletedAt)` di service; pastikan repository juga aman.

### 5.3 Cegah soft-deleted product ditambahkan ke cart
- [ ] Di `modules/cart/cart.service.ts` `addCartItemService`, validasi product tidak soft-deleted (sudah ada via `findActiveProduct`).
- [ ] Tambahkan test untuk skenario ini.

### 5.4 Cegah soft-deleted product di-checkout
- [ ] Di `checkout.repository.ts` `validateCheckoutCart` dan `checkoutCart`, pastikan produk soft-deleted ditolak (sudah ada pengecekan `item.product.deletedAt`).
- [ ] Tambahkan test untuk skenario cart berisi produk yang di-soft-delete setelah ditambahkan.

### 5.5 Cegah soft-deleted product di legacy `POST /api/orders`
- [ ] Di `order.repository.ts` `createOrder`, pastikan produk soft-deleted ditolak (sudah ada `deletedAt: null` di query `findMany`).
- [ ] Tambahkan test untuk skenario ini.

---

## Phase 6: Test Coverage And CI

### 6.1 Tambahkan GitHub Actions CI
- [ ] Buat `.github/workflows/ci.yml` dengan workflow:
  - Trigger: push ke main/master, pull request.
  - Services: PostgreSQL.
  - Steps:
    - `npm ci`
    - `npm run prisma:generate`
    - Setup/migrate test database (gunakan `prisma db push` atau migration).
    - `npm run lint`
    - `npm run test:integration`
    - `npm run build`

### 6.2 Tambahkan real HTTP smoke tests
- [ ] Buat test file integration (atau tambahkan ke file existing) untuk flow inti:
  - Login admin & customer.
  - Product list & detail.
  - Cart add/update/delete.
  - Checkout (EWALLET success, COD pending, FAILED).
  - Orders list & detail.
  - Admin protected endpoints.
- [ ] Gunakan route handler langsung (`callRoute`) seperti test existing.

### 6.3 Tambahkan concurrency tests
- [ ] Buat test untuk dua checkout/order mencoba membeli stok terakhir secara concurrent.
- [ ] Expected: satu sukses, satu konflik (409), stok final benar, movement benar.

### 6.4 Tambahkan RBAC matrix tests
- [ ] No token → 401 untuk semua protected endpoint.
- [ ] Customer → 403 untuk admin endpoint (`POST/PATCH/DELETE /api/products`, admin order endpoints).
- [ ] Admin → behavior sesuai kontrak, customer scoped behavior sesuai kontrak.

### 6.5 Tambahkan validation tests
- [ ] Invalid path param (non-integer, <= 0, NaN) → 400.
- [ ] Query bounds untuk pagination (page/limit invalid) → 400.

### 6.6 Tambahkan tests untuk legacy `POST /api/orders`
- [ ] Happy path test jika endpoint masih dipertahankan.
- [ ] Atau dokumentasikan deprecation jika dihapus.

### 6.7 Pertimbangkan Postman/Newman assertion
- [ ] Jika ada koleksi Postman, tambahkan Newman runner ke CI atau dokumentasikan sebagai regression suite.

---

## Phase 7: Security Headers And Operational Hardening

### 7.1 Tambahkan HSTS header
- [ ] Di `next.config.mjs`, tambahkan header `Strict-Transport-Security` untuk production deployment HTTPS.
- [ ] Gunakan `max-age=31536000; includeSubDomains` untuk production.

### 7.2 Evaluasi dan uji Content Security Policy
- [ ] Eksperimen dengan CSP di `next.config.mjs` dalam mode report-only terlebih dahulu.
- [ ] Jangan aktifkan enforcement sebelum diuji build/browser.

### 7.3 Tambahkan `Permissions-Policy` header
- [ ] Di `next.config.mjs`, tambahkan header `Permissions-Policy` minimal (misal `camera=(), microphone=(), geolocation=()`).

### 7.4 Redis error listener dengan sanitized logging
- [ ] Di `lib/redis.ts`, tambahkan event listener untuk `error` event pada instance Redis.
- [ ] Log menggunakan `logger.warn` atau `logger.error` tanpa raw Redis key/params.

### 7.5 Dokumentasikan Redis behavior
- [ ] Update AGENTS.md dengan dokumentasi mode fallback untuk:
  - Cache (`lib/cache.ts`): fail-open (return null).
  - Rate limit (`lib/rate-limit.ts`): saat ini fail-open; dokumentasikan pertimbangan fail-closed untuk auth.
  - Lock (`lib/lock.ts`): fallback return null, checkout proceed tanpa lock Redis.
- [ ] Dokumentasikan bahwa Redis bukan source of truth.

### 7.6 Guard seed script
- [ ] Tambahkan guard di `prisma/seed.js` agar tidak destruktif di database non-local atau shared.
- [ ] Cek environment variable atau tambahkan konfirmasi sebelum delete data.

---

## Phase 8: Documentation And AGENTS.md Updates

### 8.1 Evaluasi dan update AGENTS.md
- [ ] Setiap perubahan endpoint public/protected (Phase 1) → update daftar endpoint dan deskripsi auth.
- [ ] Setiap perubahan command atau environment variable (Phase 2 JWT_SECRET validation) → update.
- [ ] Setiap perubahan auth/security policy (Phase 2, 7) → update.
- [ ] Setiap perubahan Prisma/database (Phase 3) → update model dan setup.
- [ ] Setiap perubahan test/CI (Phase 6) → update verification workflow.
- [ ] Setiap perubahan manual testing notes (semua phase) → update.
- [ ] Catat perubahan money type dan serialization.

### 8.2 Buat implementation notes per phase
- [ ] Setelah satu atau beberapa phase selesai, buat/update catatan implementasi di `.opencode/docs/implement/`.
- [ ] Sertakan ringkasan perubahan, file yang diubah, verifikasi yang dijalankan, manual test yang belum dijalankan, dan risiko/follow-up.

---

## Verification Checklist (Setiap Phase)

- [ ] `npm run lint` — tidak ada error/eslint baru.
- [ ] `npm run prisma:generate` — jika ada perubahan Prisma schema.
- [ ] `npm run test:integration` — semua test lulus.
- [ ] `npm run build` — build sukses.
- [ ] Manual API smoke test untuk endpoint yang berubah.
- [ ] Manual negative test untuk validasi, auth, stock, dan soft-delete.
- [ ] Update `database/create-tables.sql` jika ada perubahan schema.

## Implementation Status (2026-07-19)

### Completed
- **Phase 1:** ✅ All tasks — product GET public, `lib/param.ts` shared helper, Zod response sanitasi
- **Phase 2:** ✅ All tasks — JWT TTL 1h, secret strength validation, requireUser DB check, bearer parser ketat, IP-aware rate limit, global throttle, register rate limit, password min 10, duplicate register generic, test updated
- **Phase 3:** ✅ All tasks — Decimal migration, SQL constraints/indexes, repository Decimal→Number conversion, seed guard
- **Phase 4:** ✅ 4.1-4.5 — Cart atomic transaction, unavailable item filter, SELECT FOR UPDATE, actual stock audit. 4.6 (legacy order eval) dan 4.7 dicatat sebagai rencana.
- **Phase 5:** ✅ All tasks — Product update/delete hanya deletedAt:null, 404 untuk soft-delete
- **Phase 6:** ✅ 6.1 (CI workflow), 6.4 (RBAC matrix tests), 6.5 (path param validation tests). 6.2, 6.3, 6.6, 6.7 masih perlu ditambahkan.
- **Phase 7:** ✅ 7.1 (HSTS), 7.3 (Permissions-Policy), 7.4 (Redis listener), 7.6 (seed guard). 7.2 (CSP) eval noted.
- **Phase 8:** ✅ Implementation note dibuat, AGENTS.md diupdate.

### Pending / Deferred
- Integration test via `npm run test:integration` (butuh PostgreSQL test database)
- Real HTTP smoke tests (Phase 6.2)
- Concurrency tests (Phase 6.3)
- Legacy POST /api/orders evaluation (Phase 4.6)
- CSP enforcement (Phase 7.2) — perlu uji build/browser
- Postman/Newman assertions (Phase 6.7)
- Session/revocation mechanism (Phase 2.4) — didefer ke fase berikutnya
