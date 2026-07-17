# Database Rules

- Keep Prisma schema and `database/create-tables.sql` compatible.
- Use transactions for order creation and stock decrement.
- Product delete is soft delete through `deletedAt`.
- Seed must include at least one user and several products.
- Do not store plain text passwords.
- Regenerate Prisma client after schema changes.
