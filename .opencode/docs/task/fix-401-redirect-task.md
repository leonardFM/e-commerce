# Fix 401 Redirect — Invalid Token Handling

Source plan: `.opencode/docs/plan/fix-401-redirect.md`

## Overview

Saat token expired atau invalid, API mengembalikan `{ error: "Invalid token" }` HTTP 401. Client-side auth guard sekarang mendeteksi auth error via status code, bukan string matching.

## Tasks

### Opsi B — Robust (HTTP Status Code)

- [x] **B.1. `lib/admin-api.ts`** — `readJson()` attach `(error as any).status = response.status`
- [x] **B.1. `lib/customer-api.ts`** — `readJson()` attach `(error as any).status = response.status`
- [x] **B.2. `app/admin/admin-client.tsx`** — `isAuthError()` cek `(err as any).status === 401 || 403`
- [x] **B.2. `app/customer/page.tsx`** — catch block cek `(err as any).status === 401 || 403`

### Verification

- [x] `npm run lint` — 0 error, 5 warnings (pre-existing)
- [x] `npm run build` — Compiled successfully, TypeScript passed
- [!] Manual test: expired token → harus redirect ke login page
