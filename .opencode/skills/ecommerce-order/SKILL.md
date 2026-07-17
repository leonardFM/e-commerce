---
name: ecommerce-order
description: Use when implementing or reviewing order creation, stock decrement, totals, and order item logic.
---

# Ecommerce Order

Use this workflow for order features.

## Requirements

- Order creation accepts product IDs and quantities.
- Product stock is decremented in the same database transaction as order creation.
- Total price is calculated from current product prices in the transaction.
- Orders listed by API must belong to the logged-in user only.
- Deleted products should not be orderable.

## Rules

- Aggregate duplicate product IDs before checking/decrementing stock.
- Return 404 for missing products.
- Return 409 for insufficient stock.
- Use repository transaction logic, not route-level Prisma calls.
