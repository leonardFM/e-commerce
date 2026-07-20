# Implementasi: Sliding Session Token 10 Menit

## Ringkasan

Mengubah JWT TTL dari 1 jam menjadi 10 menit dengan sliding session: setiap request autentikasi yang sisa tokennya < 2 menit akan mendapatkan token baru di response body. Client API wrapper otomatis menyimpan token baru ke localStorage.

## File yang Diubah

1. **`lib/auth.ts`** — `.setExpirationTime('1h')` → `'10m'`
2. **`lib/token-context.ts`** (baru) — AsyncLocalStorage untuk menyimpan `newToken` sementara per request
3. **`lib/request.ts`** — `requireUser()`:
   - Import `als`, `setNewToken` dari `token-context.ts`
   - Import `signJwt` dari `auth.ts`
   - `als.enterWith({})` di awal untuk inisialisasi ALS context
   - Setelah DB check: `decodeJwt(token)` untuk ambil `exp`, hitung `remainingSeconds`, jika < 120 detik → `signJwt(user)` → `setNewToken(newToken)`
4. **`lib/response.ts`** — `success()`:
   - Import `getNewToken` dari `token-context.ts`
   - Cek `getNewToken()`; jika ada, response body jadi `{ data, token }`
5. **`lib/admin-api.ts`** — `readJson()`:
   - Setelah parse, jika `payload.token` ada → `localStorage.setItem('admin-token', payload.token)`
6. **`lib/customer-api.ts`** — `readJson()`:
   - Sama, simpan ke `customer-token`
7. **`AGENTS.md`** — Update auth/security, docs workflow, manual testing notes

## Verifikasi yang Dijalankan

- `npm run lint` — 0 error, 3 warnings (pre-existing, coverage files)
- `npm run build` — Compiled successfully, TypeScript passed

## Manual Test yang Belum Dijalankan

- Login admin → dapat token TTL 10m → akses endpoint → verifikasi sliding saat sisa < 2m
- Login customer → flow yang sama
- Token expired setelah 10 menit idle → 401
- Concurrent request safety (dua fetch bersamaan butuh refresh)

## Risiko / Follow-up

- `AsyncLocalStorage` berjalan di Node.js runtime; jika Next.js edge runtime digunakan di masa depan, perlu fallback ke Opsi B/C (modify return type `requireUser()` atau gunakan `Symbol` di request object).
- Tidak ada middleware yang wrapping ALS — `requireUser()` memanggil `als.enterWith({})` secara langsung.
- Client sliding session hanya untuk admin/customer API wrapper yang eksis. Jika ada client lain (third-party), mereka perlu implementasi sendiri.
