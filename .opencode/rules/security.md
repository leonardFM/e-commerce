# Security Rules

- Protected API endpoints must require JWT bearer auth.
- Use `JWT_SECRET` from environment variables.
- Never return password hashes in API responses.
- Login failure should not reveal whether the email exists.
- User-owned data must be filtered by authenticated user ID.
- Validate all request bodies and query parameters.
