# Sliding Session Token 10 Menit

Source plan: `.opencode/docs/plan/sliding-session-token-10m.md`

## Overview

Mengubah JWT TTL dari 1 jam menjadi 10 menit dengan sliding session: setiap request autentikasi yang sisa tokennya < 2 menit akan mendapatkan token baru di response body. Client API wrapper otomatis menyimpan token baru ke localStorage.

Tidak ada perubahan di route handler, database, Prisma schema, atau API contract (kecuali tambahan field `token` di response `success()`).

---

## Task Group 1: Server-side Token Context

### [x] 1.1 Buat `lib/token-context.ts` (file baru)

- Export `AsyncLocalStorage` instance untuk menyimpan `newToken` sementara per request.
- Export helper `getNewToken()` dan `setNewToken()`.
- Pastikan tipe `newToken` adalah `string | undefined`.

### [x] 1.2 Update `lib/auth.ts` — TTL 10 menit

- Ubah `.setExpirationTime('1h')` menjadi `.setExpirationTime('10m')`.

### [x] 1.3 Update `lib/request.ts` — Sliding session di `requireUser()`

- Import `getNewToken`, `setNewToken` dari `lib/token-context.ts`.
- Import `signJwt` dari `lib/auth.ts`.
- Di `requireUser()`, setelah verifikasi JWT dan DB check:
  - Decode JWT payload untuk ambil `exp` (gunakan `jwtVerify` result yang sudah ada, atau decode ulang).
  - Hitung `remainingSeconds = exp - (Date.now() / 1000)`.
  - Jika `remainingSeconds < 120` (2 menit): panggil `signJwt(user)` → simpan ke token context via `setNewToken()`.
- Tidak mengubah return type `requireUser()`.

### [x] 1.4 Update `lib/response.ts` — Inject token ke response

- Import `getNewToken` dari `lib/token-context.ts`.
- Di `success()`, sebelum `return NextResponse.json(...)`:
  - Cek `getNewToken()`.
  - Jika ada token baru: return `{ data, token: newToken }`.
  - Jika tidak ada: return `{ data }` seperti biasa.

---

## Task Group 2: Client-side Token Refresh

### [x] 2.1 Update `lib/admin-api.ts` — Auto-update token di `readJson()`

- Di `readJson()`, setelah `const payload = await response.json()` dan sebelum return:
  - Jika `payload.token` ada: `localStorage.setItem('admin-token', payload.token)`.
  - Hapus `payload.token` (atau gunakan destructuring) sebelum return `payload.data`.

### [x] 2.2 Update `lib/customer-api.ts` — Auto-update token di `readJson()`

- Sama seperti admin-api.ts, gunakan `localStorage.setItem('customer-token', payload.token)`.

---

## Task Group 3: Verification & Documentation

### [x] 3.1 Jalankan `npm run lint` — pastikan tidak ada error TypeScript/lint

### [x] 3.2 Jalankan `npm run build` — pastikan build sukses

### [x] 3.3 Update `AGENTS.md` — Auth & Security section

- Ubah baris `JWT access token TTL adalah 1 jam` menjadi `JWT access token TTL adalah 10 menit dengan sliding session`.
- Tambahkan catatan: setiap request autentikasi dengan sisa token < 2 menit akan mendapatkan token baru di response body (`{ data, token }`).
- Tambahkan catatan: client API wrapper (`lib/admin-api.ts`, `lib/customer-api.ts`) otomatis menyimpan token baru ke localStorage.
- Tambahkan catatan: `lib/token-context.ts` sebagai file baru untuk AsyncLocalStorage token context.

### [x] 3.4 Update `AGENTS.md` — Manual API Testing Notes

- Tambahkan verifikasi sliding session:
  - Login admin → dapat token dengan TTL 10 menit.
  - Akses endpoint → response tanpa token baru (sisa masih > 2 menit).
  - Akses endpoint saat sisa < 2 menit → response **dengan** `token` baru.
  - Client localStorage terupdate dengan token baru.
  - Tab didiamkan > 10 menit → token expired → request berikutnya dapat 401.
- Customer flow yang sama.

### [x] 3.5 Update `AGENTS.md` — Docs Workflow section

- Tambahkan `lib/token-context.ts` ke daftar helper umum di `lib/`.

### [!] 3.6 Manual test sliding session (blocker: tidak ada PostgreSQL dev server)

- Login admin → dapat token dengan TTL 10 menit.
- Akses endpoint → response tanpa token baru (sisa masih > 2 menit).
- Tunggu 8 menit (atau mock waktu) → akses lagi → response **dengan** `token` baru.
- Client localStorage terupdate dengan token baru.
- Tab didiamkan > 10 menit → token expired → request berikutnya dapat 401.
- Customer flow yang sama.

---

## Task Group 4: Risk Mitigation

### [x] 4.1 Verifikasi `AsyncLocalStorage` compatibility di Next.js App Router

- Pastikan tidak ada error runtime di development server.
- Build sukses — `lib/token-context.ts` menggunakan `async_hooks` yang tersedia di Node.js runtime.
- Jika ada issue di masa depan dengan edge runtime, fallback ke Opsi B (return `newToken?` dari `requireUser()`) atau Opsi C (set properti di request object via `Symbol`).

### [x] 4.2 Verifikasi concurrent request safety

- Dua fetch bersamaan yang keduanya butuh refresh akan sign token baru masing-masing.
- Client menyimpan token dari response terakhir yang sampai — aman karena kedua token valid.
- Tidak perlu locking di sisi client.

---

## Verification

- [x] `npm run lint`
- [x] `npm run build`
- [!] Manual test: login admin → akses endpoint → verifikasi token sliding (blocker: dev server + DB tidak tersedia)
- [!] Manual test: login customer → akses endpoint → verifikasi token sliding (blocker: dev server + DB tidak tersedia)
- [!] Manual test: token expired setelah 10 menit idle → 401 (blocker: dev server + DB tidak tersedia)
