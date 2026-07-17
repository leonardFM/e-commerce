# Coding Standard

- Use TypeScript and keep types explicit at module boundaries.
- Prefer small, direct functions over unnecessary abstractions.
- Use `AppError` for expected HTTP errors.
- Use `success` and `failure` for API responses.
- Keep UI API helpers in `lib/admin-api.ts` for admin frontend integration.
- Run `npm run lint` and `npm run build` before considering changes complete.
