# Backend Production Hardening Plan

## Goal

Meningkatkan maturity backend Solutech Commerce dari level demo/MVP menjadi lebih siap production dengan fokus pada security, data integrity, transaction safety, API contract, abuse protection, dan verification workflow.

## Current Assessment

- Demo / portfolio / tugas / prototype: 8/10.
- Internal MVP kecil: 7/10.
- Production public e-commerce: 5.5-6/10.

Backend sudah memiliki fondasi bagus: Next.js App Router API, Zod validation, service/repository layering, Prisma transaction untuk order/checkout, JWT auth, RBAC admin/customer, Redis helper, structured logging, dan integration tests. Gap utama ada di hardening security, precision data uang, DB constraints/indexes, concurrency audit, dan CI/test automation.

## Scope

- Hardening backend API, auth, database, dan transaction behavior.
- Menjaga pola layering route/service/repository yang sudah ada.
- Memperbaiki API contract yang belum sesuai kebutuhan storefront public.
- Menambah verifikasi otomatis dan test coverage penting.
- Update dokumentasi workflow jika command, environment, Prisma/database, security, atau verification berubah.

## Out Of Scope

- Redesign UI besar.
- Integrasi payment gateway real.
- Multi-warehouse inventory.
- Full observability stack eksternal.
- Deployment infrastructure lengkap di luar CI dasar.

## Phase 1: API Contract And Validation Fixes

1. Jadikan `GET /api/products` public jika katalog memang harus bisa diakses storefront tanpa login.
2. Jadikan `GET /api/products/:id` public jika detail produk aktif harus bisa diakses tanpa login.
3. Pertahankan `POST`, `PATCH`, dan `DELETE /api/products` tetap admin-only dengan `requireRole(request, 'ADMIN')`.
4. Buat helper shared untuk parsing positive integer path param yang mengembalikan HTTP 400 lewat `AppError`.
5. Ganti `parseProductId()` di cart route agar invalid `productId` tidak menjadi HTTP 500.
6. Evaluasi response Zod validation agar tidak mengembalikan detail raw yang berpotensi memantulkan input sensitif.

## Phase 2: Auth And Abuse Protection Hardening

1. Perpendek access token TTL dari `7d` ke durasi lebih aman, misalnya 15-60 menit.
2. Tambahkan validasi runtime kekuatan `JWT_SECRET`:
   - Tidak boleh kosong.
   - Tidak boleh memakai placeholder/default seperti `change-me-in-production`.
   - Minimal panjang/entropy yang layak, misalnya 32 karakter random.
3. Update `requireUser()` agar memverifikasi user masih ada dan role terkini dari database, atau tambahkan token version/session model.
4. Tambahkan mekanisme revocation/session jika dibutuhkan untuk logout, role change, atau password reset.
5. Perketat parsing `Authorization: Bearer <token>` agar header dengan segment ekstra tidak diterima.
6. Perkuat login rate limit:
   - Kombinasi email + IP jika IP tersedia.
   - Global throttle untuk burst abuse.
   - Pertimbangkan fallback in-memory atau fail-closed khusus auth jika Redis unavailable.
7. Tambahkan rate limit untuk `POST /api/auth/register`.
8. Tingkatkan password policy minimal ke 10-12 karakter atau strength check yang setara.
9. Evaluasi apakah duplicate register tetap mengembalikan `Email already registered` atau pesan generic untuk mengurangi enumeration.

## Phase 3: Money Precision And Database Integrity

1. Ubah field uang dari `Float` ke tipe aman:
   - Opsi A: Prisma `Decimal @db.Decimal(12,2)`.
   - Opsi B: integer minor unit, misalnya rupiah sebagai integer jika tidak butuh pecahan.
2. Update field terkait:
   - `Product.price`.
   - `Order.shippingCost`.
   - `Order.subtotal`.
   - `Order.total`.
   - `OrderItem.unitPrice`.
3. Update Prisma schema, migration/SQL setup, seed data, repository calculations, response serialization, dan tests.
4. Tambahkan DB check constraints lewat migration/SQL untuk invariant utama:
   - `Product.stock >= 0`.
   - `Product.price >= 0`.
   - `CartItem.quantity > 0`.
   - `OrderItem.quantity > 0`.
   - `Order.shippingCost >= 0`.
   - `Order.subtotal >= 0`.
   - `Order.total >= 0`.
5. Tambahkan indexes untuk query umum:
   - Active product listing/order: `Product(deletedAt, createdAt)`.
   - User order list: `Order(userId, createdAt)`.
   - Admin order pagination: `Order(createdAt)`.
   - Inventory filter/list: `InventoryMovement(productId, createdAt)` dan `InventoryMovement(type, createdAt)`.
6. Pastikan `database/create-tables.sql` atau migration setup tetap selaras dengan Prisma.

## Phase 4: Transaction And Concurrency Safety

1. Perkuat cart mutation agar validasi active product dan stock terjadi atomik dengan write.
2. Pastikan `addCartItem` tidak bisa menyimpan quantity akhir melebihi stock saat race.
3. Pastikan `setCartItemQuantity` menolak product soft-deleted dan quantity melebihi stock pada saat write.
4. Filter atau tandai unavailable cart item saat product soft-deleted muncul di cart read.
5. Perbaiki checkout inventory movement audit agar `stockBefore` dan `stockAfter` tidak stale saat concurrent checkout.
6. Pertimbangkan `SELECT ... FOR UPDATE` pada product row sebelum stock decrement di checkout.
7. Evaluasi order legacy `POST /api/orders` apakah masih diperlukan. Jika masih dipakai, pastikan behavior checkout/order konsisten.
8. Pastikan payment side effect masa depan terjadi setelah lock/idempotency siap, bukan sebelum DB lock.

## Phase 5: Product Soft Delete Consistency

1. Update product repository write path agar update/delete hanya berlaku untuk `deletedAt: null`.
2. Soft delete produk yang sudah deleted sebaiknya mengembalikan 404 atau response idempotent yang jelas.
3. Tambahkan test untuk update/delete produk yang sudah soft-deleted.
4. Pastikan produk soft-deleted tidak bisa:
   - Ditambahkan ke cart.
   - Di-checkout jika sudah ada di cart.
   - Diorder lewat legacy `POST /api/orders`.

## Phase 6: Test Coverage And CI

1. Tambahkan GitHub Actions CI atau workflow setara dengan PostgreSQL service.
2. CI minimal menjalankan:
   - `npm ci`.
   - `npm run prisma:generate`.
   - Setup/migrate test database.
   - `npm run lint`.
   - `npm run test:integration`.
   - `npm run build`.
3. Tambahkan real HTTP smoke tests untuk flow inti jika memungkinkan:
   - Login.
   - Product list/detail.
   - Cart add/update/delete.
   - Checkout.
   - Orders list/detail.
   - Admin protected endpoint.
4. Tambahkan concurrency tests:
   - Dua checkout/order mencoba membeli stok terakhir.
   - Expected: satu sukses, satu konflik, stok final benar, movement benar.
5. Tambahkan RBAC matrix tests:
   - No token -> 401 untuk protected endpoint.
   - Customer -> 403 untuk admin endpoint.
   - Admin/customer role behavior sesuai kontrak.
6. Tambahkan validation tests untuk invalid path param dan query bounds.
7. Tambahkan tests untuk legacy `POST /api/orders` happy path atau deprecate endpoint jika tidak lagi dibutuhkan.
8. Tambahkan Postman/Newman assertion jika koleksi manual ingin dijadikan regression smoke suite.

## Phase 7: Security Headers And Operational Hardening

1. Tambahkan HSTS untuk production deployment HTTPS.
2. Evaluasi dan uji Content Security Policy sebelum diaktifkan.
3. Tambahkan `Permissions-Policy` minimal.
4. Tambahkan Redis error listener dengan sanitized logging.
5. Dokumentasikan Redis behavior untuk cache, rate limit, dan lock, termasuk mode fallback.
6. Tambahkan guard seed script agar tidak destruktif di database non-local atau shared.

## Verification Checklist

- `npm run lint`.
- `npm run test` atau minimal `npm run test:integration`.
- `npm run build`.
- Jika Prisma schema berubah: `npm run prisma:generate`.
- Jika migration/SQL berubah: jalankan setup database test dan verifikasi schema parity.
- Manual API smoke test dengan seeded admin/customer.
- Manual negative tests untuk unauthorized, forbidden, validation error, insufficient stock, dan soft-deleted product.

## Documentation Updates

- Update `AGENTS.md` jika ada perubahan endpoint public/protected, command, environment variable, auth/security policy, Prisma/database setup, CI/verification workflow, atau manual testing notes.
- Buat/update implementation note di `.opencode/docs/implement/` setiap phase selesai.
- Jika money type berubah, update dokumentasi setup dan contoh request/response jika serialization berubah.

## Suggested Priority Order

1. Public product GET contract dan invalid path param 400.
2. JWT hardening minimum: secret strength, bearer parser, shorter TTL, DB user check.
3. Money precision migration.
4. DB constraints dan indexes.
5. Cart/checkout concurrency hardening.
6. CI + missing integration tests.
7. Rate limit register/login hardening.
8. Security headers dan operational guard seed script.

## Risks

- Mengubah money type bisa menyentuh banyak file dan test; perlu dilakukan sebagai phase terpisah.
- Memperpendek JWT TTL dapat memengaruhi UX dashboard/customer jika belum ada refresh/session strategy.
- Membuat product GET public mengubah security/API contract dan perlu dipastikan sesuai kebutuhan bisnis.
- DB constraints bisa gagal diterapkan jika data existing sudah melanggar invariant.
- Concurrency fixes perlu diuji dengan PostgreSQL asli, bukan hanya mock/unit tests.
