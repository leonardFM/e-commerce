# Solutech Commerce Backend

Next.js App Router API with Prisma, PostgreSQL, JWT auth, products, and orders.

## Environment Variables

Copy `.env.example` to `.env` and fill these values:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `JWT_SECRET`: secret used to sign and verify login tokens.

## Local Run

1. Start database services:
   ```bash
   docker compose up -d db adminer redis redisinsight
   ```
2. Create tables using the SQL file:
   ```bash
   psql -h localhost -U postgres -d solutech -f database/create-tables.sql
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Seed initial data:
   ```bash
   npm run prisma:seed
   ```
5. Start the app:
   ```bash
   npm run dev
   ```

## Seeded User

- Email: `admin@solutech.test`
- Password: `password123`

## API Overview

- `POST /api/auth/login`
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/orders`
- `POST /api/orders`

## Auth

Send the JWT as a bearer token:

```bash
Authorization: Bearer <token>
```
