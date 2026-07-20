# Task: Prompt Requirement Gap Close

Source plan: `.opencode/docs/plan/prompt-gap-close-plan.md`

> Menutup gap antara spesifikasi `prompt.txt` dengan implementasi: product endpoints wajib login, update README.

---

## Phase 1: Product GET Endpoints — Require Login

**Problem:** `GET /api/products` dan `GET /api/products/:id` saat ini public, padahal prompt mensyaratkan *"Fitur product dan order hanya dapat diakses setelah login"*.

### 1.1 `app/api/products/route.ts` — GET handler

- [x] Tambah import `requireUser` dari `@/lib/request` (sudah ada import `requireRole`).
- [x] Tambah `let userId: number | undefined` di luar try block.
- [x] Panggil `const user = await requireUser(request)` di dalam try, set `userId = user.userId`.
- [x] Update `failure()` call untuk menyertakan `userId`.

Hasil akhir:

```typescript
export async function GET(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const query = listProductsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    return success(await listProductsService(query))
  } catch (error) {
    return failure(error, { feature: 'products', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
```

### 1.2 `app/api/products/[id]/route.ts` — GET handler

- [x] Tambah import `requireUser` dari `@/lib/request` (sudah ada import `getJsonBody, requireRole`).
- [x] Tambah `let userId: number | undefined` di luar try block.
- [x] Panggil `const user = await requireUser(request)` di dalam try, set `userId = user.userId`.
- [x] Update `failure()` call untuk menyertakan `userId`.

Hasil akhir:

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const { id } = await params
    return success(await getProductService(parsePositiveInt(id, 'product')))
  } catch (error) {
    return failure(error, { feature: 'products', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
```

---

## Phase 2: Update README

**Problem:** README outdated — hanya mencantumkan 9 endpoint, 1 seeded user, 2 env var.

### 2.1 Environment Variables

- [x] Ganti section **Environment Variables** dengan daftar lengkap dari `.env.example`:

```markdown
## Environment Variables

Copy `.env.example` to `.env` and fill these values:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma (required).
- `JWT_SECRET`: Secret used to sign and verify JWT tokens. Minimum 32 characters (required).
- `REDIS_URL`: Redis connection string for caching, rate limiting, and locks (optional — app works without it).
- `LOG_LEVEL`: Logging level for Pino (default: `debug` in development, `info` otherwise).
- `LOG_DESTINATION`: Log output destination — `stdout` or `file` (default: `stdout`).
- `LOG_FILE_PATH`: Path for file logging when `LOG_DESTINATION=file` (default: `logs/app.jsonl`).
- `SLOW_QUERY_THRESHOLD_MS`: Prisma slow query warning threshold in ms (default: `100`).
- `SLOW_CACHE_THRESHOLD_MS`: Cache operation slow warning threshold in ms (default: `50`).
```

### 2.2 Seeded Users

- [x] Ganti section **Seeded User** dengan dua user:

```markdown
## Seeded Users

- **Admin:** `admin@solutech.test` / `password123`
- **Customer:** `customer@solutech.test` / `password123`
```

### 2.3 API Overview

- [x] Ganti section **API Overview** dengan daftar lengkap:

```markdown
## API Overview

### Auth
- `POST /api/auth/login` — Login (returns JWT token)
- `POST /api/auth/register` — Register new customer

### Products (require login)
- `GET /api/products` — List products (paginated, searchable)
- `POST /api/products` — Create product (admin only)
- `GET /api/products/:id` — Get product detail
- `PATCH /api/products/:id` — Update product (admin only)
- `DELETE /api/products/:id` — Soft delete product (admin only)

### Cart (require login, customer only)
- `GET /api/cart` — Get current cart
- `DELETE /api/cart` — Clear cart
- `POST /api/cart/items` — Add item to cart
- `PATCH /api/cart/items/:productId` — Update cart item quantity
- `DELETE /api/cart/items/:productId` — Remove item from cart

### Checkout (require login, customer only)
- `POST /api/checkout` — Checkout (creates order, deducts stock)

### Orders (require login)
- `GET /api/orders` — List own orders (customer)
- `GET /api/orders/:id` — Get own order detail (customer)
- `GET /api/admin/orders` — List all orders (admin)
- `PATCH /api/admin/orders/:id/status` — Update order status (admin)
- `PATCH /api/admin/orders/:id/payment` — Update payment status (admin)

### Inventory (require login, admin only)
- `GET /api/inventory/movements` — List inventory movements
- `POST /api/inventory/adjustments` — Create inventory adjustment
```

### 2.4 Setup Instructions

- [x] Update **Local Run** dengan langkah Prisma migration:

```markdown
## Local Run

1. Start database services:
   ```bash
   docker compose up -d db adminer redis redisinsight
   ```
2. Create database:
   ```bash
   createdb solutech
   ```
3. Run Prisma migration:
   ```bash
   npm run prisma:migrate
   ```
   Or apply SQL manually:
   ```bash
   psql -h localhost -U postgres -d solutech -f database/create-tables.sql
   ```
4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
5. Seed initial data:
   ```bash
   npm run prisma:seed
   ```
6. Start the app:
   ```bash
   npm run dev
   ```
```

### 2.5 Auth section

- [x] Update **Auth** section dengan format yang sudah ada (tetap, sudah cukup jelas).

---

## Verification

- [x] `npm run lint` — 0 errors (5 pre-existing warnings)
- [x] `npm run build` — build sukses
- [x] `npm run test` — 21/21 unit test lulus
- [ ] Manual: `GET /api/products` tanpa token → 401
- [ ] Manual: `GET /api/products` dengan token customer → 200
- [ ] Manual: `GET /api/products/:id` tanpa token → 401
- [ ] Manual: homepage `/` tetap tampil
- [x] Update `AGENTS.md` — endpoint products sekarang protected

## Follow-up

- [x] Buat implementation notes di `.opencode/docs/implement/` setelah implementasi selesai
