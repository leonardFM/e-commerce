---
name: auth-rbac
description: Use when implementing or reviewing JWT auth, protected routes, login, authorization, or user-scoped data access.
---

# Auth RBAC

Use this workflow for authentication and authorization.

## Current Auth Model

- Login endpoint: `POST /api/auth/login`.
- JWT helpers: `lib/auth.ts`.
- Protected request helper: `lib/request.ts`.
- Passwords are hashed with `bcryptjs`.
- Tokens are sent as `Authorization: Bearer <token>`.

## Rules

- Protected endpoints must call `requireUser(request)`.
- Do not expose password hashes.
- Return generic credential errors for login failure.
- User-owned resources must filter by authenticated `userId`.
- Use `JWT_SECRET` from environment variables.

## Review Checklist

- Missing auth on protected endpoints.
- User can only access their own order list.
- Token parsing rejects invalid schemes.
- Validation failures return 400, auth failures return 401.
