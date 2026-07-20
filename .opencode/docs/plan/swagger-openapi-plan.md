# Swagger / OpenAPI Documentation Plan

## Goal

Menambahkan dokumentasi API interaktif berbasis OpenAPI/Swagger untuk 20 endpoint. Dapat diakses via browser dan bisa di-export sebagai Postman collection.

## Current Assessment

- 20 endpoint sudah stable
- Zod schemas sudah jelas di masing-masing module
- Tidak ada library swagger/openapi
- Tidak ada `public/` directory
- Tidak ada file spesifikasi API formal

## Approaches Considered

| Approach | Pros | Cons |
|---|---|---|
| **A. `next-swagger-doc`** | Ringan, designed for Next.js App Router, auto-generate dari JSDoc | Perlu annotate JSDoc di tiap route handler |
| **B. Manual OpenAPI YAML** | Tidak perlu dependency, full control | Rentan outdated, effort maintenance tinggi |
| **C. `zod-to-openapi`** | Type-safe, reuse Zod schemas langsung | Library tambahan, path definitions tetap manual |

**Rekomendasi: Approach A (`next-swagger-doc`)** — paling praktis untuk Next.js App Router, komunitas besar.

---

## Phase 1: Install Dependencies

```bash
npm install next-swagger-doc swagger-ui-react
npm install -D @types/swagger-ui-react
```

- `next-swagger-doc` — membaca JSDoc annotations di route handler, menghasilkan OpenAPI spec JSON
- `swagger-ui-react` — Swagger UI component untuk tampilan interaktif

## Phase 2: Buat Swagger Config & Route

### 2.1 `lib/swagger.ts`

Buat file konfigurasi:

```typescript
import { createSwaggerSpec } from 'next-swagger-doc'

export const apiDocument = createSwaggerSpec({
  apiFolder: 'app/api',
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Solutech Commerce API',
      version: '1.0.0',
      description: 'E-commerce backend API — Next.js App Router, Prisma, PostgreSQL, JWT auth.',
    },
    servers: [{ url: '/', description: 'Local server' }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
})
```

### 2.2 `app/api/docs/route.ts`

GET endpoint yang mengembalikan OpenAPI spec JSON:

```typescript
import { NextResponse } from 'next/server'
import { apiDocument } from '@/lib/swagger'

export async function GET() {
  return NextResponse.json(apiDocument)
}
```

## Phase 3: Swagger UI Page

### 3.1 `app/docs/page.tsx`

Halaman interaktif Swagger UI:

```typescript
'use client'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocs() {
  return <SwaggerUI url="/api/docs" />
}
```

Route: `/docs` — browser-accessible documentation.

## Phase 4: Add JSDoc Annotations to All Routes

Tambahkan `/** @openapi */` JSDoc block di setiap route handler. Format untuk `next-swagger-doc`:

### Auth

**`POST /api/auth/login`**
```typescript
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: admin@solutech.test }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AuthResponse'
 *                 token: { type: string }
 *       401:
 *         description: Invalid credentials
 */
```

**`POST /api/auth/register`**
```typescript
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string, minLength: 10 }
 *               name: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Registration successful
 *       409:
 *         description: Registration failed (duplicate)
 */
```

**`GET /api/products`**
```typescript
/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List products (paginated, searchable)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated product list
 *       401:
 *         description: Unauthorized
 */
```

Pattern yang sama untuk semua endpoint (lihat tabel di bawah).

### Route Files to Annotate (15 files)

| # | File | Methods | Tags |
|---|------|---------|------|
| 1 | `app/api/auth/login/route.ts` | POST | `[Auth]` |
| 2 | `app/api/auth/register/route.ts` | POST | `[Auth]` |
| 3 | `app/api/products/route.ts` | GET, POST | `[Products]` |
| 4 | `app/api/products/[id]/route.ts` | GET, PATCH, DELETE | `[Products]` |
| 5 | `app/api/cart/route.ts` | GET, DELETE | `[Cart]` |
| 6 | `app/api/cart/items/route.ts` | POST | `[Cart]` |
| 7 | `app/api/cart/items/[productId]/route.ts` | PATCH, DELETE | `[Cart]` |
| 8 | `app/api/checkout/route.ts` | POST | `[Checkout]` |
| 9 | `app/api/orders/route.ts` | GET | `[Orders]` |
| 10 | `app/api/orders/[id]/route.ts` | GET | `[Orders]` |
| 11 | `app/api/admin/orders/route.ts` | GET | `[Admin Orders]` |
| 12 | `app/api/admin/orders/[id]/status/route.ts` | PATCH | `[Admin Orders]` |
| 13 | `app/api/admin/orders/[id]/payment/route.ts` | PATCH | `[Admin Orders]` |
| 14 | `app/api/inventory/movements/route.ts` | GET | `[Inventory]` |
| 15 | `app/api/inventory/adjustments/route.ts` | POST | `[Inventory]` |

## Phase 5: Component Schemas

Definisikan reusable schemas di `lib/swagger.ts` → `components.schemas`:

- `AuthResponse` — `{ id, email, name, role }`
- `ProductRecord` — `{ id, name, description, price, stock, createdAt, updatedAt }`
- `CartRecord` — `{ id, userId, items: CartItemRecord[], total }`
- `CartItemRecord` — `{ id, productId, productName, unitPrice, stock, quantity, lineTotal }`
- `OrderRecord` — `{ id, userId, status, paymentStatus, paymentMethod, items: OrderItemRecord[], total, ... }`
- `OrderItemRecord` — `{ id, productId, productName, quantity, unitPrice }`
- `InventoryMovementRecord` — `{ id, productId, type, quantityChange, stockBefore, stockAfter, ... }`
- `PaginationMeta` — `{ page, limit, total, totalPages }`
- `ErrorResponse` — `{ error: string }`
- `ValidationError` — `{ error: string, issues: [{ path, code, message }] }`

## Files Affected

| File | Change |
|------|--------|
| `package.json` | Tambah `next-swagger-doc` + `swagger-ui-react` + `@types/swagger-ui-react` |
| `lib/swagger.ts` | **Baru** — OpenAPI spec config + component schemas |
| `app/api/docs/route.ts` | **Baru** — serve spec JSON |
| `app/docs/page.tsx` | **Baru** — Swagger UI page (client component) |
| `app/api/auth/login/route.ts` | Tambah JSDoc |
| `app/api/auth/register/route.ts` | Tambah JSDoc |
| `app/api/products/route.ts` | Tambah JSDoc |
| `app/api/products/[id]/route.ts` | Tambah JSDoc |
| `app/api/cart/route.ts` | Tambah JSDoc |
| `app/api/cart/items/route.ts` | Tambah JSDoc |
| `app/api/cart/items/[productId]/route.ts` | Tambah JSDoc |
| `app/api/checkout/route.ts` | Tambah JSDoc |
| `app/api/orders/route.ts` | Tambah JSDoc |
| `app/api/orders/[id]/route.ts` | Tambah JSDoc |
| `app/api/admin/orders/route.ts` | Tambah JSDoc |
| `app/api/admin/orders/[id]/status/route.ts` | Tambah JSDoc |
| `app/api/admin/orders/[id]/payment/route.ts` | Tambah JSDoc |
| `app/api/inventory/movements/route.ts` | Tambah JSDoc |
| `app/api/inventory/adjustments/route.ts` | Tambah JSDoc |
| `AGENTS.md` | — (Opsional: tambah command/URL untuk docs) |

## Verification

- [ ] `npm run lint` — 0 errors baru
- [ ] `npm run build` — build sukses
- [ ] `GET /api/docs` — mengembalikan OpenAPI spec JSON valid
- [ ] Buka `/docs` di browser — Swagger UI tampil dengan 20 endpoint
- [ ] Test "Try it out" untuk `POST /api/auth/login` — sukses 200
- [ ] Test endpoint protected dengan Bearer token — sukses 200
- [ ] Verifikasi path params (`[id]`, `[productId]`) tampil benar di UI
- [ ] Verifikasi component schemas (ProductRecord, OrderRecord, dll) muncul di "Schemas" tab

## Estimasi Waktu

| Phase | Estimasi |
|-------|----------|
| P1: Install + config | 5 menit |
| P2: Swagger UI page | 10 menit |
| P3: JSDoc annotations (20 endpoint) | 30-40 menit |
| P4: Component schemas | 10 menit |
| **Total** | ~60 menit |
