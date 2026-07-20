# Prompt Requirement Gap Close — Implementation

## Ringkasan

Menutup gap antara spesifikasi `prompt.txt` dengan implementasi: product endpoints di-protect dengan `requireUser`, dan README diupdate.

## Files Changed

| File | Change |
|------|--------|
| `app/api/products/route.ts` | GET handler: tambah `requireUser`, `userId` tracking |
| `app/api/products/[id]/route.ts` | GET handler: tambah `requireUser`, `userId` tracking |
| `README.md` | Rewrite: env vars lengkap, seeded users, API list 20 endpoint, setup steps |
| `AGENTS.md` | Update endpoint products dari public ke protected |

## Detail

### Phase 1 — Product Auth

- `GET /api/products`: tambah `requireUser(request)`, set `userId`, update `failure()` context
- `GET /api/products/:id`: tambah `requireUser(request)`, set `userId`, update `failure()` context
- Admin endpoints (POST, PATCH, DELETE) tetap `requireRole(request, 'ADMIN')` — tidak berubah

### Phase 2 — README

- **Environment Variables:** 8 var dari `.env.example` dengan deskripsi
- **Seeded Users:** Admin + Customer
- **API Overview:** 6 grup (Auth, Products, Cart, Checkout, Orders, Inventory) — 20 endpoint
- **Local Run:** Tambah `createdb`, Prisma migration option

## Verification

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors (5 pre-existing warnings) |
| `npm run build` | ✅ Compiled successfully |
| `npm run test` (unit) | ✅ 21/21 passed |

## Manual Test Belum Dijalankan

- GET `/api/products` tanpa token → 401
- GET `/api/products` dengan token → 200
- GET `/api/products/:id` tanpa token → 401
- Homepage `/` tetap tampil

## Follow-up

Tidak ada.
