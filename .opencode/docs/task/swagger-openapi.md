# Task: Swagger / OpenAPI Documentation

Source plan: `.opencode/docs/plan/swagger-openapi-plan.md`

> Menambahkan dokumentasi API interaktif berbasis OpenAPI/Swagger untuk 20 endpoint. Dapat diakses via browser.

---

## Phase 1: Install Dependencies

- [x] Install packages:
  ```bash
  npm install next-swagger-doc swagger-ui-react
  npm install -D @types/swagger-ui-react
  ```

## Phase 2: Buat Swagger Config & Route

### 2.1 `lib/swagger.ts`

- [x] Buat file konfigurasi OpenAPI spec:

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

- [x] Buat endpoint `GET /api/docs`:

```typescript
import { NextResponse } from 'next/server'
import { apiDocument } from '@/lib/swagger'

export async function GET() {
  return NextResponse.json(apiDocument)
}
```

## Phase 3: Swagger UI Page

- [x] Buat `app/docs/page.tsx`:

```typescript
'use client'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocs() {
  return <SwaggerUI url="/api/docs" />
}
```

Route: `/docs` — Swagger UI interaktif.

## Phase 4: Component Schemas

- [x] Tambahkan reusable component schemas di `lib/swagger.ts` → `definition.components.schemas`:

```typescript
components: {
  securitySchemes: { ... },
  schemas: {
    AuthResponse: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        email: { type: 'string' },
        name: { type: 'string', nullable: true },
        role: { type: 'string', enum: ['ADMIN', 'CUSTOMER'] },
      },
    },
    ProductRecord: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
        price: { type: 'number' },
        stock: { type: 'integer' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    CartItemRecord: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        productId: { type: 'integer' },
        productName: { type: 'string' },
        unitPrice: { type: 'number' },
        stock: { type: 'integer' },
        quantity: { type: 'integer' },
        lineTotal: { type: 'number' },
      },
    },
    CartRecord: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        items: { type: 'array', items: { $ref: '#/components/schemas/CartItemRecord' } },
        total: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    OrderItemRecord: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        productId: { type: 'integer' },
        productName: { type: 'string' },
        quantity: { type: 'integer' },
        unitPrice: { type: 'number' },
      },
    },
    OrderRecord: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        status: { type: 'string', enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'] },
        paymentStatus: { type: 'string', enum: ['PENDING', 'PAID'] },
        paymentMethod: { type: 'string', enum: ['BANK_TRANSFER', 'EWALLET', 'COD'] },
        paymentReference: { type: 'string' },
        shippingName: { type: 'string' },
        shippingPhone: { type: 'string' },
        shippingAddress: { type: 'string' },
        shippingCity: { type: 'string' },
        shippingPostalCode: { type: 'string' },
        shippingCost: { type: 'number' },
        subtotal: { type: 'number' },
        total: { type: 'number' },
        items: { type: 'array', items: { $ref: '#/components/schemas/OrderItemRecord' } },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    InventoryMovementRecord: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        productId: { type: 'integer' },
        productName: { type: 'string' },
        userId: { type: 'integer', nullable: true },
        orderId: { type: 'integer', nullable: true },
        type: { type: 'string', enum: ['ORDER_CHECKOUT', 'ADMIN_ADJUSTMENT'] },
        quantityChange: { type: 'integer' },
        stockBefore: { type: 'integer' },
        stockAfter: { type: 'integer' },
        note: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    PaginationMeta: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
      },
    },
    ErrorResponse: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
    ValidationError: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'array', items: { type: 'string' } },
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
}
```

## Phase 5: Add JSDoc Annotations (15 Route Files — 20 Endpoints)

Tambahkan `/** @openapi */` JSDoc block di setiap route handler. Berikut detail tiap file:

### 5.1 `app/api/auth/login/route.ts`

- [x] Tambah JSDoc di atas `export async function POST`:

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
 *         description: Login successful — returns JWT token
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
```

### 5.2 `app/api/auth/register/route.ts`

- [x] Tambah JSDoc di atas `export async function POST`:

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
 *               email: { type: string, example: user@example.com }
 *               password: { type: string, minLength: 10, example: password123 }
 *               name: { type: string, nullable: true, example: John }
 *     responses:
 *       201:
 *         description: Registration successful — returns JWT token
 *       409:
 *         description: Registration failed (duplicate email)
 */
```

### 5.3 `app/api/products/route.ts` (GET + POST)

- [x] Tambah JSDoc di atas `export async function GET`:

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
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search products by name
 *     responses:
 *       200:
 *         description: Paginated product list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductRecord'
 *                     meta:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 */
```

- [x] Tambah JSDoc di atas `export async function POST`:

```typescript
/**
 * @openapi
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product (admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: Wireless Mouse }
 *               description: { type: string, nullable: true }
 *               price: { type: number, example: 150000 }
 *               stock: { type: integer, example: 50 }
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ProductRecord'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 */
```

### 5.4 `app/api/products/[id]/route.ts` (GET + PATCH + DELETE)

- [x] Tambah JSDoc untuk GET, PATCH, DELETE:

**GET** — Tambahkan di atas GET handler:
```typescript
/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product detail
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product detail
 *       404:
 *         description: Product not found
 */
```

**PATCH** — Tambahkan di atas PATCH handler:
```typescript
/**
 * @openapi
 * /api/products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update product (admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string, nullable: true }
 *               price: { type: number }
 *               stock: { type: integer }
 *     responses:
 *       200:
 *         description: Product updated
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Product not found
 */
```

**DELETE** — Tambahkan di atas DELETE handler:
```typescript
/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Soft delete product (admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product deleted (soft)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted: { type: boolean }
 *       403:
 *         description: Forbidden (not admin)
 */
```

### 5.5 `app/api/cart/route.ts` (GET + DELETE)

- [x] Tambah JSDoc untuk GET:

```typescript
/**
 * @openapi
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get current cart (customer only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current cart with items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/CartRecord'
 */
```

- [x] Tambah JSDoc untuk DELETE:

```typescript
/**
 * @openapi
 * /api/cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear cart (customer only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */
```

### 5.6 `app/api/cart/items/route.ts` (POST)

- [x] Tambah JSDoc di atas POST handler:

```typescript
/**
 * @openapi
 * /api/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart (customer only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: integer, example: 1 }
 *               quantity: { type: integer, default: 1, example: 2 }
 *     responses:
 *       201:
 *         description: Item added to cart
 *       409:
 *         description: Quantity exceeds product stock
 */
```

### 5.7 `app/api/cart/items/[productId]/route.ts` (PATCH + DELETE)

- [x] Tambah JSDoc untuk PATCH:

```typescript
/**
 * @openapi
 * /api/cart/items/{productId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update cart item quantity (customer only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity: { type: integer, minimum: 0, example: 3 }
 *     responses:
 *       200:
 *         description: Cart item updated (quantity 0 = remove)
 */
```

- [x] Tambah JSDoc untuk DELETE:

```typescript
/**
 * @openapi
 * /api/cart/items/{productId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart (customer only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Cart item removed
 */
```

### 5.8 `app/api/checkout/route.ts` (POST)

- [x] Tambah JSDoc di atas POST handler:

```typescript
/**
 * @openapi
 * /api/checkout:
 *   post:
 *     tags: [Checkout]
 *     summary: Checkout — create order from cart (customer only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [BANK_TRANSFER, EWALLET, COD]
 *               shippingName: { type: string }
 *               shippingPhone: { type: string }
 *               shippingAddress: { type: string }
 *               shippingCity: { type: string }
 *               shippingPostalCode: { type: string }
 *               shippingCost: { type: number, default: 0 }
 *               simulatePaymentStatus:
 *                 type: string
 *                 enum: [PAID, PENDING, FAILED]
 *     responses:
 *       201:
 *         description: Order created
 *       409:
 *         description: Insufficient stock or checkout in progress
 */
```

### 5.9 `app/api/orders/route.ts` (GET)

- [x] Tambah JSDoc di atas GET handler:

```typescript
/**
 * @openapi
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: List own orders (customer)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
```

### 5.10 `app/api/orders/[id]/route.ts` (GET)

- [x] Tambah JSDoc di atas GET handler:

```typescript
/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get own order detail (customer)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Order detail
 *       404:
 *         description: Order not found
 */
```

### 5.11 `app/api/admin/orders/route.ts` (GET)

- [x] Tambah JSDoc di atas GET handler:

```typescript
/**
 * @openapi
 * /api/admin/orders:
 *   get:
 *     tags: [Admin Orders]
 *     summary: List all orders (admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated list of all orders
 *       403:
 *         description: Forbidden (not admin)
 */
```

### 5.12 `app/api/admin/orders/[id]/status/route.ts` (PATCH)

- [x] Tambah JSDoc di atas PATCH handler:

```typescript
/**
 * @openapi
 * /api/admin/orders/{id}/status:
 *   patch:
 *     tags: [Admin Orders]
 *     summary: Update order status (admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PAID, PROCESSING, SHIPPED, COMPLETED]
 *     responses:
 *       200:
 *         description: Order status updated
 *       409:
 *         description: Invalid status transition
 */
```

### 5.13 `app/api/admin/orders/[id]/payment/route.ts` (PATCH)

- [x] Tambah JSDoc di atas PATCH handler:

```typescript
/**
 * @openapi
 * /api/admin/orders/{id}/payment:
 *   patch:
 *     tags: [Admin Orders]
 *     summary: Update payment status (admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [PENDING, PAID]
 *     responses:
 *       200:
 *         description: Payment status updated
 *       409:
 *         description: Cannot change payment from PAID to PENDING
 */
```

### 5.14 `app/api/inventory/movements/route.ts` (GET)

- [x] Tambah JSDoc di atas GET handler:

```typescript
/**
 * @openapi
 * /api/inventory/movements:
 *   get:
 *     tags: [Inventory]
 *     summary: List inventory movements (admin only)
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
 *         name: productId
 *         schema: { type: integer }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [ORDER_CHECKOUT, ADMIN_ADJUSTMENT] }
 *     responses:
 *       200:
 *         description: Paginated inventory movements
 *       403:
 *         description: Forbidden (not admin)
 */
```

### 5.15 `app/api/inventory/adjustments/route.ts` (POST)

- [x] Tambah JSDoc di atas POST handler:

```typescript
/**
 * @openapi
 * /api/inventory/adjustments:
 *   post:
 *     tags: [Inventory]
 *     summary: Create inventory adjustment (admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: integer, example: 1 }
 *               quantityChange: { type: integer, example: 10 }
 *               note: { type: string }
 *     responses:
 *       201:
 *         description: Adjustment created
 *       409:
 *         description: Adjustment would make stock negative
 */
```

## Verification

- [x] `npm run lint` — 0 errors baru
- [x] `npm run build` — build sukses
- [x] `GET /api/docs` — mengembalikan OpenAPI spec JSON valid
- [ ] Buka `/docs` di browser — Swagger UI tampil dengan 20 endpoint
- [ ] Test "Try it out" untuk `POST /api/auth/login` — sukses 200
- [ ] Test endpoint protected dengan Bearer token — sukses 200
- [ ] Verifikasi path params (`{id}`, `{productId}`) tampil benar di UI
- [ ] Verifikasi component schemas muncul di "Schemas" tab

## Follow-up

- [x] Buat implementation notes di `.opencode/docs/implement/` setelah implementasi selesai
