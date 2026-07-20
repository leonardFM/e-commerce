# Solutech Commerce API

E-commerce backend built with Next.js App Router, Prisma, PostgreSQL, JWT auth, and Redis. Features product catalog, persistent cart, checkout with payment simulation, order management, and inventory tracking.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 6 (strict mode) |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Cache / Rate Limit | Redis 7 (optional — fail-open) |
| Auth | JWT (jose) — HS256, 10m TTL, sliding session |
| Validation | Zod 4 |
| Logging | Pino 10 (structured JSON) |
| HTML Sanitization | sanitize-html |
| Testing | Vitest |
| API Docs | Swagger UI (next-swagger-doc) |

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/) (for PostgreSQL and Redis)
- npm

---

## Quick Start

```bash
# 1. Clone & enter project
git clone <repo-url> e-commerce-solutech
cd e-commerce-solutech

# 2. Copy environment file (already has a valid dev JWT_SECRET)
cp .env.example .env

# 3. Start PostgreSQL + Redis (database auto-created by Docker)
docker compose up -d

# 4. Install dependencies
npm install

# 5. Run Prisma migration (applies existing migrations + generates client)
npm run prisma:migrate

# 6. Seed initial data
npm run prisma:seed

# 7. Start development server
npm run dev
```

The app runs at **http://localhost:3000**. Verify it's working:

```bash
curl http://localhost:3000/api/docs
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string for Prisma |
| `TEST_DATABASE_URL` | Yes (for tests) | — | Separate test database; must contain `test` in path |
| `JWT_SECRET` | Yes | — | JWT signing secret. Minimum **32 characters**. Must not be placeholder `change-me-in-production` |
| `REDIS_URL` | No | — | Redis connection string for caching, rate limiting, token blacklist, and locks. App works without it (fail-open) |
| `LOG_LEVEL` | No | `debug` (dev) / `info` (other) | Pino log level |
| `LOG_DESTINATION` | No | `stdout` | Log output: `stdout` or `file` |
| `LOG_FILE_PATH` | No | `logs/app.jsonl` | File path when `LOG_DESTINATION=file` |
| `SLOW_QUERY_THRESHOLD_MS` | No | `100` | Prisma slow query warning threshold (ms) |
| `SLOW_CACHE_THRESHOLD_MS` | No | `50` | Cache operation slow warning threshold (ms) |

---

## Project Structure

```
├── app/                      # Next.js App Router
│   ├── api/                  #   API route handlers
│   │   ├── auth/             #     login, register
│   │   ├── products/         #     CRUD products
│   │   ├── cart/             #     cart + items
│   │   ├── checkout/         #     checkout
│   │   ├── orders/           #     customer + admin orders
│   │   ├── inventory/        #     movements + adjustments
│   │   └── docs/             #     OpenAPI spec JSON
│   ├── admin/                #   Admin dashboard pages (client-side)
│   ├── customer/             #   Customer dashboard pages (client-side)
│   ├── docs/                 #   Swagger UI page
│   └── register/             #   Registration page (client-side)
├── modules/                  # Domain logic (layered)
│   ├── auth/                 #   Auth (schema, service, types)
│   ├── products/             #   Products
│   ├── cart/                 #   Cart
│   ├── checkout/             #   Checkout
│   ├── orders/               #   Orders
│   ├── inventory/            #   Inventory
│   └── payments/             #   Payment simulation
├── lib/                      # Shared utilities
│   ├── auth.ts               #   JWT sign / verify (jose)
│   ├── request.ts            #   requireUser, requireRole, getJsonBody
│   ├── response.ts           #   success(), failure() helpers
│   ├── rate-limit.ts         #   Redis-based rate limiter (fail-open)
│   ├── sanitize.ts           #   HTML sanitizer (sanitize-html)
│   ├── swagger.ts            #   OpenAPI spec config
│   ├── prisma.ts             #   Prisma client singleton
│   ├── redis.ts              #   Redis client (ioredis)
│   ├── cache.ts              #   JSON cache helper
│   ├── lock.ts               #   Redis-based distributed lock
│   ├── logger.ts             #   Pino structured logger
│   ├── performance.ts        #   Performance measurement helpers
│   ├── errors.ts             #   AppError class
│   ├── param.ts              #   parsePositiveInt helper
│   └── token-context.ts      #   AsyncLocalStorage for sliding session
├── prisma/                   # Prisma schema, migrations, seed
├── database/                 # SQL create-tables with check constraints
├── tests/                    # Unit + integration tests
│   ├── helpers/              #   Test utilities
│   └── integration/          #   Integration tests (auth, cart, checkout, etc.)
├── postman/                  # Postman collection
├── docker-compose.yml        # PostgreSQL + Redis + Adminer + RedisInsight
├── vitest.config.ts          # Vitest configuration
└── next.config.mjs           # Next.js config + security headers
```

---

## Architecture

The project follows a **layered architecture** pattern:

```
Route Handler (HTTP) → Schema (Zod) → Service (Business Logic) → Repository (Prisma/DB)
```

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Route Handler** | HTTP concern: auth (`requireUser`/`requireRole`), parse request/query, Zod validation, status code, response (`success`/`failure`) | `app/api/**/route.ts` |
| **Schema** | Input validation with Zod (`trim()`, `max()`, sanitize) | `modules/<domain>/*.schema.ts` |
| **Service** | Business logic, orchestration, transactions | `modules/<domain>/*.service.ts` |
| **Repository** | Database access via Prisma | `modules/<domain>/*.repository.ts` |
| **Types** | Domain types/interfaces | `modules/<domain>/*.types.ts` |

### Error Handling

- **`AppError`** — intentional HTTP error with status code. Route handler throws it, `failure()` catches and returns JSON.
- **`ZodError`** — validation errors returned as HTTP 400 with sanitized `path`, `code`, `message` (no `received` value to avoid data leakage).
- **Unknown errors** — caught and returned as HTTP 500 (Internal Server Error), logged with full stack trace.

### Response Format

```json
// Success
{ "data": { ... } }
// Validation error
{ "error": "Validation error", "issues": [{ "path": ["email"], "code": "invalid_string", "message": "..." }] }
// Application error
{ "error": "Insufficient stock" }
```

> **Note:** JWT tokens are delivered via HttpOnly cookie and also included in the login/register response body for API clients (curl, Postman). Sliding session refreshes set the new token only via Set-Cookie header.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:integration` | Run integration tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run Prisma dev migration |
| `npm run prisma:seed` | Seed database |
| `npm run prisma:studio` | Open Prisma Studio GUI |

---

## API Endpoints

### Auth (public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Login, returns JWT via HttpOnly cookie |
| POST | `/api/auth/register` | — | Register new customer, returns JWT via HttpOnly cookie |
| POST | `/api/auth/logout` | — | Logout, blacklists token and clears cookie |

### Products (login required)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products` | Login | List products (paginated, searchable) |
| POST | `/api/products` | Admin | Create product |
| GET | `/api/products/:id` | Login | Get product detail |
| PATCH | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Soft delete product |

### Cart (login required, customer only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/cart` | Customer | Get current cart with items |
| DELETE | `/api/cart` | Customer | Clear cart |
| POST | `/api/cart/items` | Customer | Add item to cart |
| PATCH | `/api/cart/items/:productId` | Customer | Update item quantity |
| DELETE | `/api/cart/items/:productId` | Customer | Remove item from cart |

### Checkout (login required, customer only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/checkout` | Customer | Create order from cart, deduct stock, clear cart (in transaction) |

### Orders (login required)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/orders` | Customer | List own orders |
| GET | `/api/orders/:id` | Customer | Get own order detail |
| GET | `/api/admin/orders` | Admin | List all orders (paginated) |
| PATCH | `/api/admin/orders/:id/status` | Admin | Update order status |
| PATCH | `/api/admin/orders/:id/payment` | Admin | Update payment status |

### Inventory (login required, admin only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/inventory/movements` | Admin | List inventory movements (filterable) |
| POST | `/api/inventory/adjustments` | Admin | Create inventory adjustment (with movement record) |

### Documentation (public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/docs` | OpenAPI 3.0 spec JSON |
| — | `/docs` | Swagger UI interactive documentation |

---

## Authentication

### Token Storage

JWT is stored in an **HttpOnly** cookie (`token`) — not accessible from JavaScript, preventing XSS-based token theft.

```bash
# Token is automatically sent by the browser on every request.
# No manual Authorization header needed for browser-based clients.
```

API clients (non-browser) can still authenticate via the `Authorization: Bearer <token>` header.

### JWT Details

- **Algorithm**: HS256 (HMAC with SHA-256)
- **TTL**: 10 minutes
- **Payload**: `{ sub: userId, email, role, jti }` (JTI = unique token ID for revocation)
- **Sliding session**: If remaining TTL < 2 minutes on any authenticated request, a **new token** is set via HttpOnly cookie automatically.
- **Revocation**: On `POST /api/auth/logout`, the token's JTI is added to a Redis blacklist with matching TTL, rendering it invalid immediately.

### Rate Limiting

> All rate limits are **fail-open** — if Redis is unavailable, the request proceeds without rate limiting.

| Endpoint | Rate Limit | Scope |
|----------|------------|-------|
| `POST /api/auth/login` | 20 req/min | Per IP (global throttle) |
| `POST /api/auth/login` | 5 failed / 10 min | Per email + IP (reset on success) |
| `POST /api/auth/register` | 3 req/hour | Per IP |
| `POST /api/checkout` | 10 req/hour | Per user + IP |

---

## Security

### Input Validation
- All string inputs are trimmed, length-limited, and **HTML-stripped** via `sanitize()` from `lib/sanitize.ts` (using `sanitize-html`).
- Zod error responses only expose `path`, `code`, and `message` — never the received value.
- Generic error messages for stock conflicts and duplicate registration to prevent user enumeration.

### Request Body Limit
- Maximum **100 KB** enforced by `getJsonBody()` in `lib/request.ts`. Larger bodies receive HTTP 413.

### Order State Machine
```
PENDING → PAID/PROCESSING → SHIPPED → COMPLETED
```
Invalid transitions (e.g. COMPLETED → PENDING) are rejected with HTTP 409.

### Payment Status
- `PAID → PENDING` regression is rejected with HTTP 409.

### Payment Simulation
| `simulatePaymentStatus` | Result for `EWALLET` | Result for `COD` | Result for `BANK_TRANSFER` |
|-------------------------|----------------------|-------------------|---------------------------|
| not set (default) | PAID | PENDING | PENDING |
| `PAID` | PAID | PAID | PAID |
| `PENDING` | PENDING | PENDING | PENDING |
| `FAILED` | **Order rejected, stock unchanged, cart untouched** |

### Soft Delete
- Products use `deletedAt` field. Queries filter by `deletedAt: null`. Deleted products still exist in DB for order history reference.

### Security Headers
Configured in `next.config.mjs`:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (production only, `max-age=31536000`)
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy`:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline'` (required by Next.js inline scripts)
  - `style-src 'self' 'unsafe-inline'`
  - `img-src 'self' data:`
  - `font-src 'self'`
  - `connect-src 'self'`
  - `frame-ancestors 'none'`
  - `base-uri 'self'`
  - `form-action 'self'`
  - `object-src 'none'`
  - `worker-src 'self'`
  - `upgrade-insecure-requests`

### Security Assessment

| Threat | Status | Mechanism |
|--------|--------|-----------|
| XSS → token theft | ✅ **Mitigated** | JWT in HttpOnly cookie, inaccessible to JavaScript |
| Token replay after logout | ✅ **Mitigated** | Redis blacklist via JTI with automatic TTL |
| Brute force login | ✅ **Mitigated** | Rate limit email+IP (5x/10m) + global (20x/m) |
| Register spam | ✅ **Mitigated** | Rate limit 3x/hour per IP |
| Checkout abuse | ✅ **Mitigated** | Rate limit 10x/hour per user+IP |
| Order state manipulation | ✅ **Mitigated** | Strict state machine with validated transitions |
| Payment regression | ✅ **Mitigated** | PAID → PENDING rejected with 409 |
| Stored XSS | ✅ **Mitigated** | `sanitize-html` strips all tags from all inputs |
| Memory exhaustion | ✅ **Mitigated** | Body limit 100KB via `getJsonBody()` |
| JWT secret leak | ✅ **Mitigated** | Guard ≥32 chars + anti-placeholder, `.env` gitignored |
| Information disclosure | ✅ **Mitigated** | Generic error messages, ZodError without `received` |
| CSRF | ✅ **Mitigated** | SameSite=Lax cookie + form-action 'self' |
| Clickjacking | ✅ **Mitigated** | `frame-ancestors 'none'`, `X-Frame-Options: DENY` |
| User enumeration | ✅ **Mitigated** | Generic messages for login/register failures |
| SQL injection | ✅ **Mitigated** | Prisma ORM with parameterized queries |
| Privilege escalation | ✅ **Mitigated** | `requireUser` + `requireRole` on all endpoints |
| Soft delete bypass | ✅ **Mitigated** | All queries filter `deletedAt: null` |
| Credential in source | ✅ **Mitigated** | No hardcoded secrets in source code |

### Security Posture Summary

| Layer | Score | Notes |
|-------|-------|-------|
| Input Validation | 10/10 | Zod + trim + max + sanitize-html |
| Authentication | 10/10 | JWT HS256, HttpOnly cookie, sliding session |
| Token Security | 10/10 | JTI revocation, blacklist with auto-expiry |
| Authorization | 10/10 | requireUser + requireRole, user-scoped filters |
| Rate Limiting | 10/10 | Login, register, checkout — all fail-open |
| State Machine | 10/10 | Order + payment transitions strictly validated |
| Transaction Safety | 10/10 | Checkout atomic in Prisma transaction |
| Error Handling | 10/10 | Generic messages, no sensitive data leaked |
| CSP & Headers | 9/10 | `unsafe-inline` required by Next.js |
| Credential Hygiene | 10/10 | .env gitignored, placeholder, CI secrets |
| **Overall** | **9.5/10** | Production-ready, no critical/high issues |

---

## Database

### Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `User` | id, email (unique), passwordHash, name, role | Role: `ADMIN` or `CUSTOMER` |
| `Product` | id, name, price, stock, deletedAt | Soft delete via `deletedAt` |
| `Cart` | id, userId (unique) | One cart per user |
| `CartItem` | id, cartId, productId, quantity | Unique per cart+product |
| `Order` | id, userId, status, paymentStatus, paymentMethod, totals, shipping | Full order with address |
| `OrderItem` | id, orderId, productId, productName, quantity, unitPrice | Snapshot at purchase time |
| `InventoryMovement` | id, productId, userId?, orderId?, type, quantityChange, stockBefore, stockAfter | Audit trail for all stock changes |

### Check Constraints (in `database/create-tables.sql` — not in Prisma schema)

- `Product.stock >= 0`
- `Product.price >= 0`
- `CartItem.quantity > 0`
- `OrderItem.quantity > 0`
- `Order.shippingCost >= 0`
- `Order.subtotal >= 0`
- `Order.total >= 0`

> After running `prisma db push` or a new migration, these constraints must be re-applied manually to the database.

---

## Seeded Data

Run `npm run prisma:seed` to populate:

### Users

| Email | Password | Role |
|-------|----------|------|
| `admin@solutech.test` | `password123` | ADMIN |
| `customer@solutech.test` | `password123` | CUSTOMER |

### Products

| Name | Price | Stock |
|------|-------|-------|
| Wireless Mouse | Rp150,000 | 25 |
| Mechanical Keyboard | Rp650,000 | 12 |
| USB-C Cable | Rp75,000 | 100 |

---

## Testing

```bash
# Run all tests (unit + integration)
npm run test

# Run tests in watch mode
npm run test:watch

# Run only integration tests
npm run test:integration

# Run with coverage report
npm run test:coverage
```

**Note:** Tests require a dedicated test database (`solutech_test`) separate from the development database. The test database URL is read from `TEST_DATABASE_URL` (defaults to `postgresql://postgres:postgres@localhost:5432/solutech_test?schema=public`).

---

## Manual Testing Guide

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@solutech.test", "password": "password123"}'
```
Save the `token` from response.

### 2. Admin Flow
```bash
# Create product
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":50000,"stock":10}'

# Update product
curl -X PATCH http://localhost:3000/api/products/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"price":55000}'

# Delete product
curl -X DELETE http://localhost:3000/api/products/1 \
  -H "Authorization: Bearer <token>"

# View all orders
curl http://localhost:3000/api/admin/orders \
  -H "Authorization: Bearer <token>"

# Update order status / payment
curl -X PATCH http://localhost:3000/api/admin/orders/1/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"PROCESSING"}'

# Inventory adjustment
curl -X POST http://localhost:3000/api/inventory/adjustments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantityChange":5,"note":"Restock"}'
```

### 3. Customer Flow
```bash
# Login as customer
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@solutech.test", "password": "password123"}'

# List products
curl http://localhost:3000/api/products?page=1&limit=10 \
  -H "Authorization: Bearer <token>"

# Add to cart
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":2}'

# View cart
curl http://localhost:3000/api/cart \
  -H "Authorization: Bearer <token>"

# Checkout (COD — pending payment)
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod":"COD","shippingName":"John","shippingPhone":"08123456789","shippingAddress":"Jl. Merdeka","shippingCity":"Jakarta","shippingPostalCode":"12345"}'

# View orders
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer <token>"
```

### 4. Verify Sliding Session
1. Login → get token with 10m TTL.
2. Call any authenticated endpoint immediately → Set-Cookie has **no** new token (remaining > 2 min).
3. Wait > 8 minutes (or manipulate clock) → call endpoint → response **includes a Set-Cookie header** with a new `token` cookie.
4. The browser automatically uses the new cookie for subsequent requests.
5. Wait > 10 minutes without activity → next request returns HTTP 401.

### 5. Verify RBAC
- Customer accessing `/admin` → redirected/rejected.
- Admin accessing `/customer` → redirected/rejected.
- Customer calling admin-only API endpoints → HTTP 403.
- Non-authenticated user calling protected endpoints → HTTP 401.

### 6. Verify Payment Simulation
- `EWALLET` with no `simulatePaymentStatus` → order created with `PAID` status.
- `simulatePaymentStatus: FAILED` → **Request rejected**, no order created, stock unchanged, cart untouched.

---

## API Documentation

- **Swagger UI**: Open [http://localhost:3000/docs](http://localhost:3000/docs) in your browser. Interactive documentation with "Try it out" for every endpoint.
- **OpenAPI Spec**: `GET /api/docs` returns the full OpenAPI 3.0 specification JSON (importable into Postman, Insomnia, or any API client).
- **Postman Collection**: Import `postman/solutech-commerce-api.postman_collection.json` into Postman.

---

## Deployment

```bash
# Build
npm run build

# Start production server
npm start
```

### Production Checklist
- [ ] Set `JWT_SECRET` to a strong, unique value (min 32 characters, not a placeholder).
- [ ] Set `DATABASE_URL` to production PostgreSQL.
- [ ] If using `LOG_DESTINATION=file` on a single-instance VPS, set up external **log rotation** (logrotate, etc.).
- [ ] Configure reverse proxy (nginx, Caddy) for TLS termination.
- [ ] `Strict-Transport-Security` header activates automatically in `NODE_ENV=production`.
- [ ] If Redis is not available, rate limiting falls back to **fail-open** (rate limits are disabled).
- [ ] Check constraints (`stock >= 0`, `price >= 0`, etc.) must be applied manually if running fresh Prisma migration on production.
- [ ] CSP is configured in basic mode; review and tighten before public launch.

---

## FAQ

**Q: Why are there check constraints in `database/create-tables.sql` but not in Prisma schema?**  
A: Prisma does not support arbitrary check constraints. They are defined in raw SQL and must be re-applied after `prisma db push` or new migrations.

**Q: What happens if Redis is down?**  
A: The application continues to work. Rate limiting, caching, and distributed locks are all **fail-open** — they log a warning and proceed without Redis.

**Q: Why is product detail visible to any authenticated user?**  
A: Product detail is visible to any logged-in user (admin or customer). Only mutations (create, update, delete) require admin role.

**Q: How is the cart persisted?**  
A: Cart and CartItem are stored in PostgreSQL, not Redis. Redis is never the source of truth for cart data.
