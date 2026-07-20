# Implementasi: Postman Collection Seluruh Endpoint

## Ringkasan Perubahan

- Menambahkan Postman collection untuk seluruh endpoint API Solutech Commerce.
- Collection memakai Postman Collection schema v2.1.
- Menambahkan variable `baseUrl`, `customerToken`, `adminToken`, `productId`, dan `orderId`.
- Menyusun request per folder domain: `Auth`, `Products`, `Cart`, `Checkout`, `Orders`, `Admin Orders`, dan `Inventory`.
- Menambahkan contoh body JSON sesuai schema request yang ada.
- Menambahkan header `Authorization: Bearer {{customerToken}}` atau `Authorization: Bearer {{adminToken}}` untuk endpoint protected.
- Menambahkan Postman test script pada login customer/admin untuk menyimpan token otomatis dari `data.token`.

## File Yang Diubah

- `postman/solutech-commerce-api.postman_collection.json`
- `.opencode/docs/implement/postman-collection-seluruh-endpoint.md`
- `.opencode/docs/task/postman-collection-seluruh-endpoint.md`

## Referensi

- Source plan: `.opencode/docs/plan/postman-collection-plan.md`
- Source task: `.opencode/docs/task/postman-collection-seluruh-endpoint.md`
- Route files: `app/api/**/route.ts`
- Schema files: `modules/<domain>/*.schema.ts`
- Auth response reference: `modules/auth/auth.service.ts` dan `lib/response.ts`

## Verifikasi Yang Dijalankan

- Validasi JSON collection dengan `node -e "JSON.parse(...)"`.
- `npm run lint` tidak dijalankan karena perubahan hanya menambah file JSON dan markdown, tanpa perubahan TypeScript/API runtime.

## Manual Test Yang Belum Dijalankan

- Import collection ke Postman.
- Jalankan server lokal dengan `npm run dev`.
- Login admin dan customer untuk memastikan variable token tersimpan otomatis.
- Jalankan flow customer: list products, cart, checkout, dan orders.
- Jalankan flow admin: product mutation, order status/payment update, dan inventory adjustment.
- Uji request protected tanpa token menghasilkan HTTP 401.
- Uji customer token pada endpoint admin menghasilkan HTTP 403.

## Risiko / Follow-up

- Nilai default `productId` dan `orderId` adalah `1`; perlu disesuaikan dengan data seed/database lokal saat manual test.
- Postman test script memakai token path `data.token`, sudah diverifikasi dari response wrapper `success()` dan `authResponse()`.
- Endpoint `GET /api/products` saat ini protected, sehingga collection menyertakan customer token.

## Status AGENTS.md

Tidak diubah. Perubahan ini hanya menambah artefak dokumentasi/manual testing Postman dan tidak mengubah endpoint, command, environment variable, arsitektur, auth/security behavior, database/Prisma setup, atau workflow verifikasi project.
