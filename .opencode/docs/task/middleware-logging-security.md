# Middleware Logging untuk Security Monitoring

Source plan: `.opencode/docs/plan/middleware-logging-security.md`

## Overview

Membuat `middleware.ts` di root project untuk mencatat setiap request HTTP ke API secara terpusat menggunakan structured logger Pino. Middleware mencatat method, pathname, status code, durasi, IP, User-Agent, dan userId (hash) untuk mendukung deteksi anomaly, forensik insiden, dan monitoring real-time.

Tidak ada perubahan pada route handler, service, repository, Prisma schema, atau API contract. Response path dan API behavior tidak berubah.

---

## Task Group 1: Middleware Utama

### [ ] 1.1 Buat `middleware.ts` di root project

- Gunakan `NextMiddleware` atau `NextResponse.next()` dari `next/server`.
- Matcher: `'/api/:path*'` — hanya untuk API routes, bukan halaman atau static files.
- Catat `method`, `pathname`, `status`, `durationMs`, `ip`, `userAgent`, `userIdHash`.
- `ip`: dari header `x-forwarded-for` (ambil IP pertama), fallback ke `x-real-ip`, fallback ke `'unknown'`.
- `userAgent`: dari header `user-agent`, fallback ke `'unknown'`.
- `userIdHash`: dari `als.getStore()` — jika `store?.userId` ada, hash dengan `logHash(String(store.userId))`, jika tidak ada/null, catat sebagai `null`.
- Jangan membaca atau mencatat body request sama sekali.
- Jangan `await` logger — fire-and-forget agar tidak memperlambat response.
- Ikuti draft code yang ada di plan (sesuaikan dengan implementasi `TokenContext` setelah Task 1.2).

### [ ] 1.2 Export `config` dengan matcher

```typescript
export const config = {
  matcher: '/api/:path*',
}
```

### [ ] 1.3 Pastikan tipe dan struktur sudah sesuai

- Gunakan `import { logHash, logger } from '@/lib/logger'`.
- Gunakan `import { als } from '@/lib/token-context'`.
- Jika `status >= 400`, gunakan `logger.warn(logPayload, 'http_request_warn')`.
- Jika `status < 400`, gunakan `logger.info(logPayload, 'http_request')`.

---

## Task Group 2: Integrasi AsyncLocalStorage untuk userId

Agar middleware bisa membaca `userId` dari `als.getStore()`, `requireUser()` harus menyimpan `userId` ke dalam ALS store saat memproses request yang terautentikasi.

### [ ] 2.1 Update `lib/token-context.ts` — Tambahkan `userId` ke tipe store

- Tambahkan field `userId?: number` ke tipe `TokenContext`.
- Export helper `getUserId(): number | undefined`.
- Export helper `setUserId(id: number): void`.

### [ ] 2.2 Update `lib/request.ts` — Set `userId` di `requireUser()`

- Import `getUserId` dan `setUserId` dari `lib/token-context.ts`.
- Di `requireUser()`, setelah user ditemukan di database dan sebelum return, panggil `setUserId(dbUser.id)`.
- Pastikan `als.enterWith({})` sudah ada (saat ini sudah ada di baris 13 `requireUser()`).

---

## Task Group 3: Konsistensi Failure Context (Opsional)

### [ ] 3.1 Verifikasi `FailureContext.userId` di `lib/response.ts`

- `FailureContext` sudah memiliki `userId?: number`.
- Pastikan route handler yang memanggil `failure()` dengan `AppError` atau `ZodError` menyertakan `userId` dari `requireUser()` jika tersedia.
- **Tidak perlu mengubah signature** — hanya perlu konsistensi di call site.

### [ ] 3.2 Pastikan error logging mencakup userIdHash

- Tidak perlu perubahan di `lib/response.ts` jika `context.userId` sudah dikirim.
- Catat bahwa `userId` di `failure()` adalah nilai mentah (integer), sedangkan middleware menggunakan `logHash()`.

---

## Task Group 4: Dokumentasi

### [ ] 4.1 Update `AGENTS.md`

- Tambahkan informasi tentang `middleware.ts` di root project untuk API request logging.
- Catat bahwa middleware logging hanya untuk `'/api/:path*'`.
- Catat bahwa log payload mencakup `method`, `pathname`, `status`, `durationMs`, `ip`, `userAgent`, `userIdHash`.
- Catat bahwa `userIdHash` menggunakan `logHash()` (sha256 16 karakter pertama).
- Catat bahwa status >= 400 di-log sebagai `warn`, sisanya `info`.
- Catat bahwa body request tidak pernah di-log.
- Catat bahwa middleware tidak `await` logger (fire-and-forget).
- Tambahkan `middleware.ts` ke daftar file arsitektur penting jika relevan.

---

## Task Group 5: Verifikasi

### [ ] 5.1 Jalankan `npm run lint`

- Pastikan tidak ada error TypeScript/lint.

### [ ] 5.2 Jalankan `npm run build`

- Pastikan build sukses.

### [ ] 5.3 Manual test: akses endpoint API sukses

- Login via `POST /api/auth/login`.
- Akses endpoint seperti `GET /api/products` — pastikan log `http_request` muncul di stdout/file dengan level `info`.
- Verifikasi field: `method`, `pathname`, `status`, `durationMs`, `ip`, `userAgent`, `userIdHash`.

### [ ] 5.4 Manual test: akses endpoint API error

- Akses endpoint dengan `Authorization` salah — pastikan log `http_request_warn` muncul dengan level `warn` dan status >= 400.
- Akses endpoint yang tidak valid — pastikan log `http_request_warn` muncul.

### [ ] 5.5 Manual test: body request tidak muncul di log

- Kirim request POST dengan body (misal login dengan password) — pastikan body request (password) tidak tercatat di log.
- Gunakan `LOG_DESTINATION=file` untuk memeriksa file log.

### [ ] 5.6 Manual test: userIdHash berisi hash atau null

- Akses endpoint tanpa token — `userIdHash` harus `null`.
- Akses endpoint dengan token valid — `userIdHash` harus berupa string hash sha256 16 karakter, bukan angka mentah `userId`.

### [ ] 5.7 Verifikasi AsyncLocalStorage tidak conflict

- Dua request bersamaan tidak saling menimpa `userId` di ALS.
- Tidak perlu test khusus — arsitektur ALS per-request sudah aman.

---

## Verification Notes

- [ ] `npm run lint` — belum dijalankan
- [ ] `npm run build` — belum dijalankan
- [ ] Manual dev-server dan endpoint smoke test — belum dijalankan
- [ ] File log verification — belum dijalankan
