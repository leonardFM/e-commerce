# Fix 401 Redirect — Invalid Token Handling

## Goal

Saat token expired / invalid, response API mengembalikan `{ error: "Invalid token" }` status 401. Client harus mendeteksinya sebagai auth error dan redirect ke login page.

## Root Cause

`isAuthError()` di `admin-client.tsx` dan catch block di `customer/page.tsx` hanya mengecek dua nilai error message: `'Unauthorized'` dan `'Forbidden'`. Tapi expired token mengembalikan **`'Invalid token'`**.

Akibat: `handleAuthFailure` return early (karena `isAuthError` return false), tidak cleanup token, tidak redirect. Error message "Invalid token" hanya tampil di dashboard tanpa redirect.

## Changes

### A. `app/admin/admin-client.tsx` — line ~49

Update `isAuthError`:

```typescript
function isAuthError(err: unknown) {
  return err instanceof Error && (
    err.message === 'Unauthorized' ||
    err.message === 'Forbidden' ||
    err.message === 'Invalid token'
  )
}
```

### B. `app/customer/page.tsx` — line ~100

Update kondisi catch block dari:

```typescript
if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden'))
```

menjadi:

```typescript
if (err instanceof Error && (
  err.message === 'Unauthorized' ||
  err.message === 'Forbidden' ||
  err.message === 'Invalid token'
))
```

## Alternatif — Robust Approach

Daripada string matching, bisa modifikasi `readJson()` di `lib/admin-api.ts` dan `lib/customer-api.ts` untuk throw error dengan response status, lalu `isAuthError` cek `status === 401`:

```typescript
async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json()
  if (!response.ok) {
    const error = new Error(payload?.error ?? 'Request failed')
    ;(error as any).status = response.status  // attach status code
    throw error
  }
  // ... sliding session ...
  return payload.data as T
}
```

Ini lebih robust karena tidak bergantung pada konsistensi string error dari server.

## Verification

- `npm run lint`
- `npm run build`
- Manual test: login → tunggu token expired (atau gunakan expired token manual) → request → harus redirect ke login page
