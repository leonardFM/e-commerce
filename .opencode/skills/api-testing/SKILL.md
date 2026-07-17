---
name: api-testing
description: Use when testing API endpoints manually, through Postman, or with command-line HTTP clients.
---

# API Testing

Use this workflow for manual API testing.

## Setup

- Start services with `docker compose up -d db adminer redis redisinsight`.
- Create tables with `database/create-tables.sql`.
- Run `npm run prisma:seed`.
- Start app with `npm run dev`.

## Auth

Login with seeded credentials:

- Email: `admin@solutech.test`
- Password: `password123`

Send token as:

```http
Authorization: Bearer <token>
```

## Core Scenarios

- Login success and failure.
- Product create, list, detail, update, soft delete.
- Product list pagination and search.
- Order create success.
- Order create with insufficient stock.
- Order list only returns authenticated user's orders.
- Protected endpoints return 401 without token.
