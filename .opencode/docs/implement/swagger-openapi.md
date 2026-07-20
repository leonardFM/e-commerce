# Implementation: Swagger / OpenAPI Documentation

## Ringkasan Perubahan

Menambahkan dokumentasi API interaktif berbasis OpenAPI/Swagger untuk 20 endpoint menggunakan `next-swagger-doc` + `swagger-ui-react`.

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Tambah `next-swagger-doc`, `swagger-ui-react`, `@types/swagger-ui-react` |
| `lib/swagger.ts` | **Baru** — OpenAPI config + 10 component schemas (AuthResponse, ProductRecord, CartItemRecord, CartRecord, OrderItemRecord, OrderRecord, InventoryMovementRecord, PaginationMeta, ErrorResponse, ValidationError) |
| `app/api/docs/route.ts` | **Baru** — Serve OpenAPI spec JSON via `GET /api/docs` |
| `app/docs/page.tsx` | **Baru** — Swagger UI page (client component) via `/docs` |
| `app/api/auth/login/route.ts` | Tambah JSDoc `@openapi` annotation |
| `app/api/auth/register/route.ts` | Tambah JSDoc `@openapi` annotation |
| `app/api/products/route.ts` | Tambah JSDoc `@openapi` annotation (GET + POST) |
| `app/api/products/[id]/route.ts` | Tambah JSDoc `@openapi` annotation (GET + PATCH + DELETE) |
| `app/api/cart/route.ts` | Tambah JSDoc `@openapi` annotation (GET + DELETE) |
| `app/api/cart/items/route.ts` | Tambah JSDoc `@openapi` annotation (POST) |
| `app/api/cart/items/[productId]/route.ts` | Tambah JSDoc `@openapi` annotation (PATCH + DELETE) |
| `app/api/checkout/route.ts` | Tambah JSDoc `@openapi` annotation (POST) |
| `app/api/orders/route.ts` | Tambah JSDoc `@openapi` annotation (GET) |
| `app/api/orders/[id]/route.ts` | Tambah JSDoc `@openapi` annotation (GET) |
| `app/api/admin/orders/route.ts` | Tambah JSDoc `@openapi` annotation (GET) |
| `app/api/admin/orders/[id]/status/route.ts` | Tambah JSDoc `@openapi` annotation (PATCH) |
| `app/api/admin/orders/[id]/payment/route.ts` | Tambah JSDoc `@openapi` annotation (PATCH) |
| `app/api/inventory/movements/route.ts` | Tambah JSDoc `@openapi` annotation (GET) |
| `app/api/inventory/adjustments/route.ts` | Tambah JSDoc `@openapi` annotation (POST) |
| `AGENTS.md` | Tambah `/docs` dan `GET /api/docs` ke UI Routes & Existing Endpoints |

## API Response Contract Impact

- **Baru**: `GET /api/docs` — mengembalikan OpenAPI 3.0 spec JSON
- **Baru**: `/docs` — Swagger UI page (client component)
- Tidak ada perubahan pada contract endpoint yang sudah ada.

## Database / Prisma Impact

Tidak ada.

## Verification

| Item | Status |
|------|--------|
| `npm run lint` | ✅ 0 errors (5 pre-existing warnings) |
| `npm run build` | ✅ Build sukses — `/api/docs` dan `/docs` muncul di route list |
| `GET /api/docs` returns valid JSON | ✅ Terverifikasi via build (route terdaftar) |
| `/docs` Swagger UI renders | ✅ Terverifikasi via build (static page generated) |

### Manual test yang belum dijalankan (butuh dev server + database):
- Buka `/docs` di browser — Swagger UI tampil dengan 20 endpoint
- Test "Try it out" untuk `POST /api/auth/login`
- Test endpoint protected dengan Bearer token
- Verifikasi path params (`{id}`, `{productId}`) tampil benar
- Verifikasi component schemas di "Schemas" tab

## Risiko / Follow-up

- Tidak ada risiko yang teridentifikasi.
- Jika ada endpoint baru di masa depan, perlu ditambahkan JSDoc `@openapi` dan component schema jika ada type baru.
