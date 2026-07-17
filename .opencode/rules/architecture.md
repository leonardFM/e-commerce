# Architecture Rules

- Keep API route handlers thin.
- Put business logic in `modules/<domain>/<domain>.service.ts`.
- Put Prisma queries in `modules/<domain>/<domain>.repository.ts`.
- Put Zod schemas in `modules/<domain>/<domain>.schema.ts`.
- Use shared helpers from `lib/` for auth, Prisma, errors, and responses.
- Do not bypass the service/repository layers for protected business features.
