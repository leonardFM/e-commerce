# Task: Postman Collection Seluruh Endpoint

Source plan: `.opencode/docs/plan/postman-collection-plan.md`

## Persiapan

- [x] Cek struktur endpoint aktual di `app/api/**/route.ts` terhadap daftar endpoint pada source plan.
- [x] Cek schema request di `modules/<domain>/*.schema.ts` untuk memastikan contoh body Postman sesuai validasi Zod yang ada.
- [x] Verifikasi format response login `POST /api/auth/login`, terutama lokasi token apakah benar `data.token`.

## File Postman Collection

- [x] Buat folder `postman/` jika belum ada.
- [x] Buat file `postman/solutech-commerce-api.postman_collection.json` dengan schema Postman Collection v2.1 `https://schema.getpostman.com/json/collection/v2.1.0/collection.json`.
- [x] Tambahkan collection variables: `baseUrl` default `http://localhost:3000`, `customerToken`, `adminToken`, `productId`, dan `orderId`.
- [x] Susun folder collection per domain: `Auth`, `Products`, `Cart`, `Checkout`, `Orders`, `Admin Orders`, dan `Inventory`.

## Auth Requests

- [x] Tambahkan `POST {{baseUrl}}/api/auth/register` tanpa auth dengan contoh body register customer dari plan.
- [x] Tambahkan request login customer `POST {{baseUrl}}/api/auth/login` tanpa auth dengan body seeded customer.
- [x] Tambahkan request login admin `POST {{baseUrl}}/api/auth/login` tanpa auth dengan body seeded admin.
- [x] Tambahkan Postman test script pada login customer untuk menyimpan `customerToken` dari response login bila token tersedia di `data.token`.
- [x] Tambahkan Postman test script pada login admin untuk menyimpan `adminToken` dari response login bila token tersedia di `data.token`.

## Product Requests

- [x] Tambahkan `GET {{baseUrl}}/api/products?page=1&limit=10&search=` dengan header `Authorization: Bearer {{customerToken}}` karena endpoint saat ini protected.
- [x] Tambahkan `POST {{baseUrl}}/api/products` dengan header `Authorization: Bearer {{adminToken}}`, `Content-Type: application/json`, dan contoh body create product.
- [x] Tambahkan `GET {{baseUrl}}/api/products/{{productId}}` dengan token yang sesuai.
- [x] Tambahkan `PATCH {{baseUrl}}/api/products/{{productId}}` dengan header admin token, `Content-Type: application/json`, dan contoh body update product.
- [x] Tambahkan `DELETE {{baseUrl}}/api/products/{{productId}}` dengan header admin token.
- [x] Pastikan catatan/request product tetap mencerminkan perilaku soft delete produk aktif bila relevan untuk manual check.

## Cart, Checkout, dan Order Requests

- [x] Tambahkan `GET {{baseUrl}}/api/cart` dengan `Authorization: Bearer {{customerToken}}`.
- [x] Tambahkan `DELETE {{baseUrl}}/api/cart` dengan `Authorization: Bearer {{customerToken}}`.
- [x] Tambahkan `POST {{baseUrl}}/api/cart/items` dengan customer token, `Content-Type: application/json`, dan contoh body add cart item.
- [x] Tambahkan `PATCH {{baseUrl}}/api/cart/items/{{productId}}` dengan customer token, `Content-Type: application/json`, dan contoh body update cart item.
- [x] Tambahkan `DELETE {{baseUrl}}/api/cart/items/{{productId}}` dengan customer token.
- [x] Tambahkan `POST {{baseUrl}}/api/checkout` dengan customer token, `Content-Type: application/json`, dan contoh body checkout.
- [x] Tambahkan `GET {{baseUrl}}/api/orders` dengan customer token.
- [x] Tambahkan `POST {{baseUrl}}/api/orders` dengan customer token, `Content-Type: application/json`, dan contoh body create order langsung.
- [x] Tambahkan `GET {{baseUrl}}/api/orders/{{orderId}}` dengan customer token.
- [x] Pastikan contoh checkout/order tidak mengarahkan implementer untuk melewati transaction safety stock dan total yang sudah ada.

## Admin Order dan Inventory Requests

- [x] Tambahkan `GET {{baseUrl}}/api/admin/orders?page=1&limit=10` dengan `Authorization: Bearer {{adminToken}}`.
- [x] Tambahkan `PATCH {{baseUrl}}/api/admin/orders/{{orderId}}/status` dengan admin token, `Content-Type: application/json`, dan contoh body update order status.
- [x] Tambahkan `PATCH {{baseUrl}}/api/admin/orders/{{orderId}}/payment` dengan admin token, `Content-Type: application/json`, dan contoh body update payment status.
- [x] Tambahkan `GET {{baseUrl}}/api/inventory/movements?page=1&limit=10&productId={{productId}}&type=ADMIN_ADJUSTMENT` dengan admin token.
- [x] Tambahkan `POST {{baseUrl}}/api/inventory/adjustments` dengan admin token, `Content-Type: application/json`, dan contoh body inventory adjustment.

## Dokumentasi dan Repo Workflow

- [x] Validasi file `postman/solutech-commerce-api.postman_collection.json` dengan JSON parser/formatter agar bisa di-import ke Postman.
- [x] Buat atau update catatan implementasi di `.opencode/docs/implement/` setelah collection selesai, berisi ringkasan perubahan, file yang diubah, verifikasi, manual test yang belum dijalankan, dan risiko/follow-up.
- [x] Evaluasi apakah `AGENTS.md` perlu diupdate; kemungkinan tidak perlu jika hanya menambah artefak dokumentasi/testing dan tidak mengubah endpoint, command, environment variable, arsitektur, auth/security, database/Prisma, atau workflow verifikasi.

## Verifikasi

- [ ] Import collection ke Postman dan pastikan tidak ada error format. Belum dijalankan; membutuhkan aplikasi Postman/manual UI.
- [ ] Jalankan server lokal dengan `npm run dev` bila environment tersedia. Belum dijalankan; task hanya menambah collection JSON.
- [ ] Login admin dan pastikan `adminToken` tersimpan otomatis. Belum dijalankan; membutuhkan server, database, dan Postman/manual HTTP client.
- [ ] Login customer dan pastikan `customerToken` tersimpan otomatis. Belum dijalankan; membutuhkan server, database, dan Postman/manual HTTP client.
- [ ] Jalankan `GET /api/products` dengan customer token. Belum dijalankan; membutuhkan server dan database.
- [ ] Jalankan flow admin product: create, update, dan delete product dengan admin token. Belum dijalankan; membutuhkan server dan database.
- [ ] Jalankan flow customer: add cart item, get cart, checkout, dan get orders. Belum dijalankan; membutuhkan server dan database.
- [ ] Jalankan flow admin: list orders, update status/payment, dan inventory adjustment. Belum dijalankan; membutuhkan server dan database.
- [ ] Pastikan request protected tanpa token menghasilkan HTTP 401. Belum dijalankan; membutuhkan server.
- [ ] Pastikan customer token ke endpoint admin menghasilkan HTTP 403. Belum dijalankan; membutuhkan server, database, dan token customer.
- [x] Jalankan `npm run lint` bila ada perubahan JS/TS; untuk file JSON Postman saja lint tidak wajib.

## Risiko / Ambiguitas

- [x] Konfirmasi path token response login jika bukan `data.token`; sesuaikan Postman test script bila berbeda.
- [ ] Pastikan nilai contoh `productId` dan `orderId` disesuaikan dengan seed/database lokal saat manual test. Belum dijalankan; bergantung data seed/database lokal.
