# Redis Integration Plan

## Tujuan

Menambahkan Redis sebagai cache, rate limiter, dan mekanisme lock/idempotency ringan untuk area yang read-heavy atau rentan request berulang, tanpa memindahkan sumber kebenaran data transaksi dari PostgreSQL.

Redis service sudah tersedia di `docker-compose.yml`, tetapi aplikasi belum memiliki dependency, client, environment variable, atau pemakaian Redis di kode.

## Prinsip Implementasi

- PostgreSQL tetap menjadi source of truth untuk produk, stok, cart, order, dan inventory movement.
- Redis dipakai untuk data turunan, temporary, atau proteksi request berulang.
- Cache harus memiliki TTL dan invalidation eksplisit saat data berubah.
- Jangan cache data user-scoped sensitif tanpa kebutuhan jelas.
- Perubahan dibuat bertahap agar risiko regresi kecil.

## Area Yang Membutuhkan Redis

### 1. Cache Katalog Produk

- Endpoint: `GET /api/products`
- File utama:
  - `app/api/products/route.ts`
  - `modules/products/product.service.ts`
  - `modules/products/product.repository.ts`
- Alasan:
  - List produk adalah data read-heavy untuk customer/admin.
  - Query list produk memakai filter, pagination, count, dan sorting.
  - Cache dapat mengurangi beban query PostgreSQL untuk request berulang dengan query yang sama.
- Pola key awal:
  - `products:list:{hashQuery}`
- TTL awal:
  - 30 sampai 120 detik.
- Invalidation:
  - Saat product create/update/delete.
  - Saat stok berubah lewat checkout atau inventory adjustment.

### 2. Cache Detail Produk

- Endpoint: `GET /api/products/:id`
- File utama:
  - `app/api/products/[id]/route.ts`
  - `modules/products/product.service.ts`
- Alasan:
  - Detail produk sering dibuka berulang.
  - Cache singkat aman selama invalidation dilakukan saat produk atau stok berubah.
- Pola key awal:
  - `products:detail:{productId}`
- TTL awal:
  - 30 sampai 120 detik.
- Invalidation:
  - Saat product update/delete.
  - Saat stok produk berubah lewat checkout atau inventory adjustment.

### 3. Cache Featured Products Homepage

- File utama:
  - `app/page.tsx`
- Alasan:
  - Homepage langsung query Prisma untuk 8 produk terbaru.
  - Data bersifat public/read-heavy dan tidak user-specific.
  - Ini kandidat cache paling aman untuk implementasi awal.
- Pola key awal:
  - `homepage:featured-products`
- TTL awal:
  - 30 sampai 120 detik.
- Invalidation:
  - Saat product create/update/delete.
  - Saat stok berubah lewat checkout atau inventory adjustment.

### 4. Rate Limiting Login

- Endpoint: `POST /api/auth/login`
- File utama:
  - `app/api/auth/login/route.ts`
  - `modules/auth/auth.service.ts`
- Alasan:
  - Mencegah brute force login.
  - Redis cocok untuk counter dengan TTL per email/IP.
- Pola key awal:
  - `rate-limit:login:{emailOrIp}`
- Kebijakan awal:
  - Maksimal 5 percobaan gagal per 10 menit.
  - Reset counter setelah login berhasil.
- Catatan:
  - Jika ingin rate limit berbasis IP, route handler perlu meneruskan IP/client identifier ke service atau helper rate limit.

### 5. Token Blacklist Atau Session Revocation

- File utama:
  - `lib/auth.ts`
  - `lib/request.ts`
- Alasan:
  - JWT saat ini berlaku 7 hari dan tidak bisa dicabut sebelum expired.
  - Redis bisa menyimpan blacklist token/session ID sampai token expired.
- Status:
  - Tidak perlu diimplementasikan pada tahap awal karena belum ada endpoint logout.
  - Implementasi lebih tepat dilakukan saat fitur logout/session management ditambahkan.

### 6. Checkout Idempotency Atau Lock Pendek

- Endpoint: `POST /api/checkout`
- File utama:
  - `app/api/checkout/route.ts`
  - `modules/checkout/checkout.service.ts`
  - `modules/checkout/checkout.repository.ts`
- Alasan:
  - Checkout menyentuh stok, order, inventory movement, dan clear cart.
  - Redis lock pendek dapat mengurangi risiko double-submit dari client.
- Pola key awal:
  - `checkout:lock:user:{userId}`
- TTL awal:
  - 10 sampai 30 detik.
- Catatan:
  - Redis lock bukan pengganti database transaction.
  - Validasi stok dan decrement stok tetap harus dilakukan di PostgreSQL transaction.

### 7. Temporary Lock Untuk Operasi Stok Sensitif

- Area:
  - Checkout
  - Inventory adjustment
- File utama:
  - `modules/checkout/checkout.service.ts`
  - `modules/inventory/inventory.service.ts`
- Alasan:
  - Mengurangi request paralel berlebihan untuk produk/user yang sama.
  - Membantu UX error lebih deterministik saat operasi stok sedang berjalan.
- Catatan:
  - Tetap pertahankan database transaction sebagai proteksi utama konsistensi stok.

## Area Yang Tidak Disarankan Dipindahkan Ke Redis

### Cart Utama

- Cart saat ini persistent di PostgreSQL lewat `Cart` dan `CartItem`.
- Jangan pindahkan cart ke Redis kecuali product requirement berubah menjadi cart ephemeral/session-only.
- Alasan:
  - Cart perlu konsisten dengan checkout.
  - Cart harus user-scoped dan tetap tersedia setelah refresh/login ulang.

### Order Dan Inventory Movement

- Tetap di PostgreSQL.
- Alasan:
  - Data transaksi dan audit harus durable, queryable, dan konsisten.

### Stock Sebagai Source Of Truth

- Tetap di PostgreSQL.
- Redis boleh menyimpan cache tampilan stok, tetapi decrement stok tetap lewat database transaction.

## Tahap Implementasi

### Tahap 1: Redis Client Dan Konfigurasi

- Tambahkan dependency Redis client, misalnya `ioredis` atau `redis`.
- Tambahkan `REDIS_URL` ke `.env.example`.
- Buat `lib/redis.ts` sebagai singleton Redis client.
- Buat helper cache JSON minimal di `lib/cache.ts` jika diperlukan.
- Pastikan Redis tidak membuat aplikasi crash saat environment belum dikonfigurasi di test tertentu, kecuali Redis diwajibkan secara eksplisit.

### Tahap 2: Cache Produk Dan Homepage

- Tambahkan cache ke `listProductsService`.
- Tambahkan cache ke `getProductService`.
- Tambahkan cache featured products di `app/page.tsx` atau ekstrak query featured ke service kecil jika dibutuhkan.
- Gunakan TTL pendek terlebih dahulu.

### Tahap 3: Invalidation Cache Produk

- Invalidate cache produk saat:
  - `createProductService`
  - `updateProductService`
  - `deleteProductService`
  - checkout sukses karena stok berubah
  - inventory adjustment sukses karena stok berubah
- Minimal invalidation:
  - Hapus `homepage:featured-products`.
  - Hapus detail produk terkait.
  - Hapus semua list cache dengan prefix `products:list:`.

### Tahap 4: Login Rate Limit

- Tambahkan helper rate limit berbasis Redis.
- Terapkan pada login.
- Counter naik hanya saat login gagal.
- Counter dihapus saat login berhasil.
- Return HTTP 429 saat limit tercapai.

### Tahap 5: Checkout Lock Atau Idempotency

- Tambahkan lock pendek per user saat checkout berjalan.
- Return HTTP 409 atau 429 jika checkout user yang sama sedang diproses.
- Pastikan lock dilepas di `finally`.
- Tetap pertahankan validasi dan transaction checkout yang sudah ada.

## Perubahan Dokumentasi

- Update `AGENTS.md` bila implementasi Redis dilakukan karena akan memengaruhi environment variable, workflow verifikasi, dan setup lokal.
- Update catatan implementasi di `.opencode/docs/implement/` setelah perubahan kode selesai.

## Verifikasi

- Jalankan `npm run lint` setelah perubahan TypeScript.
- Jalankan `npm run test` atau minimal test integration terkait product/auth/checkout jika Redis dipakai di flow tersebut.
- Manual smoke test:
  - Start service dengan `docker compose up -d db adminer redis redisinsight`.
  - Login admin/customer tetap berhasil.
  - `GET /api/products` tetap mengembalikan data benar.
  - Create/update/delete product menghapus cache yang relevan.
  - Homepage tetap menampilkan featured products.
  - Login gagal berulang menghasilkan rate limit.
  - Checkout tetap membuat order sekali dan tidak mengurangi stok dua kali saat request dobel.

## Prioritas Rekomendasi

1. Cache produk dan homepage.
2. Invalidation saat produk atau stok berubah.
3. Login rate limit.
4. Checkout idempotency atau lock pendek.
