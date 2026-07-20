# Prompt Requirement Gap Close Plan

## Goal

Menutup gap antara spesifikasi `prompt.txt` dengan implementasi saat ini:
1. Product API endpoints harus require login (sesuai prompt: *"Fitur product dan order hanya dapat diakses setelah login"*)
2. README outdated — daftar API, seeded users, env vars tidak lengkap

## Current Gap

| Item | Prompt Spec | Current | Fix Needed |
|------|-------------|---------|------------|
| `GET /api/products` | Harus login | Public (no auth) | Tambah `requireUser` |
| `GET /api/products/:id` | Harus login | Public (no auth) | Tambah `requireUser` |
| README API list | Lengkap | Hanya 9 endpoint | Update ke 20 endpoint |
| README seeded users | Minimal 1 user | Hanya admin | Tambah customer |
| README env vars | Dijelaskan | Hanya 2 var | Tambah semua env var |
| `POST /api/orders` | Ada | Tidak ada di README | Sudah ada endpoint, README kurang |

## Constraint

- Homepage (`/`) tetap bisa menampilkan featured products via SSR (`listFeaturedProductsService`) tanpa auth — ini adalah server-side direct call, bukan API endpoint.
- Admin `POST/PATCH/DELETE` products tetap require ADMIN role (tidak berubah).
- Tidak perlu mengubah service/repository logic — hanya tambah auth di route handler.

---

## Phase 1: Product GET Endpoints — Require Login

### 1.1 `app/api/products/route.ts` — GET handler

Tambah `requireUser(request)`:

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

Tambah `requireUser(request)`:

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

### Files Affected

- `app/api/products/route.ts`
- `app/api/products/[id]/route.ts`

---

## Phase 2: Update README

### 2.1 Environment Variables

Tambahkan semua env var dari `.env.example`:

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

Tambahkan customer user:

```markdown
## Seeded Users

- **Admin:** `admin@solutech.test` / `password123`
- **Customer:** `customer@solutech.test` / `password123`
```

### 2.3 API Overview

Update ke daftar lengkap:

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

Update langkah setup dengan Prisma migration step (karena ada migration files di `prisma/migrations/`):

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

### Files Affected

- `README.md`

---

## Verification

- [ ] `npm run lint` — 0 errors
- [ ] `npm run build` — build sukses
- [ ] `npm run test` — unit test lulus
- [ ] `npm run test:integration` — jika DB tersedia
- [ ] Manual: `GET /api/products` tanpa token → 401
- [ ] Manual: `GET /api/products` dengan token → 200
- [ ] Manual: `GET /api/products/:id` tanpa token → 401
- [ ] Manual: homepage `/` tetap tampil dengan featured products
- [ ] Update `AGENTS.md` jika ada perubahan endpoint auth status

## Follow-up

- [ ] Update `.opencode/docs/task/prompt-gap-close.md`
- [ ] Update `.opencode/docs/implement/` setelah implementasi
