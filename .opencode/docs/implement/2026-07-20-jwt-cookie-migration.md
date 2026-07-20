# JWT Cookie Migration — HttpOnly Cookie

## Goal

Migrasi JWT storage dari `localStorage` (rentan XSS exfiltration) ke HttpOnly cookie.

## Perubahan

### Server-side

**`lib/cookies.ts`** — file baru
- Helper `cookieOptions()` — konfigurasi cookie HttpOnly, Secure (production), SameSite=Lax, Path=/, maxAge 600s
- Helper `clearCookieOptions()` — untuk logout
- Helper `getTokenFromRequest(request)` — baca token dari cookie, fallback Authorization header

**`lib/request.ts`**
- `requireUser()` menggunakan `getTokenFromRequest()` (cookie first, then Authorization header)

**`lib/response.ts`**
- `success()` — sliding session: set cookie instead of adding `token` ke response body

**`app/api/auth/login/route.ts`**
- Set HttpOnly cookie `token` pada response setelah login sukses
- Return `{ user }` saja (tanpa token di body)

**`app/api/auth/register/route.ts`**
- Set HttpOnly cookie `token` pada response setelah register sukses
- Return `{ user }` saja

**`app/api/auth/logout/route.ts`** — file baru
- `POST /api/auth/logout` — clear cookie `token`

### Client-side

**`lib/admin-api.ts`**
- Hapus `authHeaders(token)` — tidak perlu Authorization header
- Semua fungsi hapus parameter `token`
- `AuthResponse` — hapus `token` field
- `readJson()` — hapus sliding session localStorage logic

**`lib/customer-api.ts`**
- Sama dengan admin-api

**`app/admin/admin-client.tsx`**
- Hapus `decodeJwt` import
- Ganti `token` state dengan `authenticated` state (dari localStorage email/role)
- Lazy state initializer untuk membaca localStorage tanpa efek
- Login simpan email/role ke localStorage, bukan token
- Logout panggil `POST /api/auth/logout` + hapus localStorage
- API calls tanpa token parameter

**`app/customer/page.tsx`**
- Sama dengan admin-client pattern

**`app/register/page.tsx`**
- Hanya simpan email/role ke localStorage, bukan token

### Test Helpers

**`tests/helpers/api.ts`**
- `createJsonRequest()` — token dikirim via `Cookie` header, bukan `Authorization`
- `login()` — ekstrak token dari `set-cookie` header, bukan response body

**`tests/integration/auth.test.ts`**
- Register test: ekstrak token dari `set-cookie` header, bukan `payload.data.token`

## Files Affected

| File | Change |
|------|--------|
| `lib/cookies.ts` | File baru |
| `lib/request.ts` | `requireUser` — cookie fallback |
| `lib/response.ts` | `success` — cookie sliding session |
| `app/api/auth/login/route.ts` | Set cookie, return user only |
| `app/api/auth/register/route.ts` | Set cookie, return user only |
| `app/api/auth/logout/route.ts` | File baru |
| `lib/admin-api.ts` | Hapus token logic |
| `lib/customer-api.ts` | Hapus token logic |
| `app/admin/admin-client.tsx` | Hapus token state |
| `app/customer/page.tsx` | Hapus token state |
| `app/register/page.tsx` | Hapus token storage |
| `tests/helpers/api.ts` | Cookie-based auth |
| `tests/integration/auth.test.ts` | Cookie token extraction |

## Verification

- [x] `npm run lint` — 0 error
- [x] `npm run build` — build sukses
- [x] `npm run test` — 51/51 lulus
- [ ] Manual: login admin → cookie ter-set → refresh → dashboard tetap muncul
- [ ] Manual: login customer → cookie ter-set → refresh → dashboard tetap muncul
- [ ] Manual: logout → cookie clear → login form muncul
- [ ] Manual: token expired (10 menit) → 401 → login form

## Security Improvement

- **Before:** JWT di `localStorage` — bisa dicuri via XSS
- **After:** JWT di HttpOnly cookie — tidak accessible dari JavaScript
- Role/email tetap di localStorage — tidak sensitif, hanya untuk UI

## Risiko/Follow-up

- API client masih support Authorization header untuk backward compat
- Cookie tidak bisa di-revoke sebelum expiry (10 menit)
- Tidak ada CSRF protection — SameSite=Lax sudah cukup untuk sebagian besar kasus
