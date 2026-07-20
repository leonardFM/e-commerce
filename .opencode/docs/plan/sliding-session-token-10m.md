# Sliding Session Token 10 Menit Plan

## Goal

Token JWT expired dalam 10 menit. Jika user masih aktif (ada API request), token otomatis diperpanjang (sliding session) tanpa perlu login ulang. Jika tidak ada aktivitas selama 10 menit, token expired dan user harus login lagi.

## Scope

- Server: `lib/auth.ts`, `lib/request.ts`, `lib/response.ts`
- Client: `lib/admin-api.ts`, `lib/customer-api.ts`
- Tidak mengubah route handler satupun — perubahan hanya di layer helper
- Tidak mengubah database, Prisma schema, atau API contract response (kecuali tambahan field `token`)

## How It Works

1. **TTL token: 10 menit** (`lib/auth.ts`)
2. **Setiap request autentikasi**, `requireUser()` mengecek sisa waktu token:
   - Jika sisa **< 2 menit**: sign JWT baru, simpan di AsyncLocalStorage
   - Jika sisa **>= 2 menit**: tidak perlu refresh
3. **`success()`** membaca AsyncLocalStorage sebelum membuat response:
   - Jika ada token baru: response body menjadi `{ data, token: "..." }`
   - Jika tidak ada: response body tetap `{ data }` seperti biasa
4. **Client API wrapper** (`readJson()` di `admin-api.ts` dan `customer-api.ts`):
   - Setelah parse response JSON, cek apakah ada field `token`
   - Jika ada: update localStorage (`admin-token` / `customer-token`)
   - Return `payload.data` seperti biasa

## Yang Tidak Berubah

- Route handler (`app/api/**/route.ts`) — **nol perubahan**
- Schema, database, Prisma
- Login/register flow (tetap return `{ data: { token, user } }`)
- Error response flow
- Auth flow untuk public endpoint (product GET)
- `requireRole()` — otomatis ikut karena panggil `requireUser()`

## Files Changed

### 1. `lib/auth.ts`
- `setExpirationTime('10m')` — TTL 10 menit

### 2. `lib/token-context.ts` (baru)
- Export `AsyncLocalStorage` instance untuk menyimpan `newToken` sementara
- Export helper `getNewToken()` dan `setNewToken()`

### 3. `lib/request.ts`
- Di `requireUser()`, setelah verifikasi JWT dan DB check:
  - Decode JWT payload untuk ambil `exp`
  - Hitung `remainingSeconds = exp - (Date.now() / 1000)`
  - Jika `remainingSeconds < 120` (2 menit): `signJwt(user)` → simpan ke token context
- Tidak mengubah return type `requireUser()`

### 4. `lib/response.ts`
- Di `success()`, sebelum return `NextResponse`:
  - Cek token context via `getNewToken()`
  - Jika ada: return `{ data, token: newToken }`
  - Jika tidak: return `{ data }` seperti biasa

### 5. `lib/admin-api.ts`
- Di `readJson()`, setelah parse `payload`:
  - Jika `payload.token` ada: `localStorage.setItem('admin-token', payload.token)`
- Hapus `payload.token` sebelum return `payload.data`

### 6. `lib/customer-api.ts`
- Sama seperti admin-api.ts, gunakan `localStorage.setItem('customer-token', ...)`

## Verification

1. `npm run lint`
2. `npm run build`
3. Manual test:
   - Login admin → dapat token dengan TTL 10m
   - Akses endpoint → response tanpa token baru (sisa masih > 2m)
   - Tunggu 8 menit (atau mock waktu) → akses lagi → response **dengan** `token` baru
   - Client localStorage terupdate dengan token baru
   - Tab didiamkan > 10 menit → token expired → request berikutnya dapat 401
4. Customer flow yang sama

## Risks

- `AsyncLocalStorage` perlu diuji di Next.js App Router. Jika ada issue (misal edge runtime tidak support), alternatifnya:
  - Opsi B: Modifikasi `requireUser()` return `{ userId, email, role, newToken? }`
  - Opsi C: `requireUser()` set properti di request object via `Symbol`
- Token baru dikirim di body response, bukan header — aman karena HTTPS.
- Client harus selalu update localStorage saat menerima token baru. Jika ada bug di client, user bisa kena 401 tiba-tiba.
- Jika ada request konkuren (2 fetch bersamaan) dan keduanya butuh refresh, keduanya akan sign token baru. Client akan menyimpan token dari response terakhir yang sampai. Ini aman karena kedua token valid untuk 10 menit ke depan.
