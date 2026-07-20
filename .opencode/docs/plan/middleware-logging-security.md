# Plan: Middleware Logging untuk Security Monitoring

## Latar Belakang

Saat ini tidak ada logging terpusat untuk seluruh request HTTP yang masuk ke aplikasi. Log hanya ditulis di dalam route handler via `failure()` untuk error, sementara request sukses (200) tidak tercatat sama sekali. Ini menyulitkan:
- Deteksi anomaly (brute force, scanning, abuse)
- Forensik insiden keamanan
- Monitoring real-time

## Solusi

Buat `middleware.ts` di root Next.js yang mencatat setiap request — method, path, status code, durasi, IP, User-Agent, dan (jika tersedia) userId — menggunakan structured logger Pino.

## Lingkup Perubahan

### 1. Buat `middleware.ts` di root project

- Gunakan `NextMiddleware` dari `next/server`
- Catat `method`, `pathname`, `status` (dari response), `durationMs`, `ip`, `userAgent`
- Gunakan `logger.info()` untuk request normal, `logger.warn()` untuk status >= 400
- Jangan log body request (termasuk password, token, PII)
- Gunakan `logHash()` atau `[REDACTED]` untuk userId agar tetap teraudit tanpa ekspos identitas langsung
- **Tidak boleh memperlambat response** — await logger tidak wajib, cukup fire-and-forget

### 2. Integrasi dengan AsyncLocalStorage untuk userId

- Akses `als` dari `lib/token-context.ts` untuk membaca userId yang sudah di-set oleh `requireUser()`
- Jika `als.getStore()` tidak memiliki userId, catat sebagai `null`

### 3. Tambahkan `userId` di failure context di `lib/response.ts`

- Saat ini `failure()` sudah menerima `context.userId` — pastikan konsisten

### 4. Update AGENTS.md

- Tambahkan informasi tentang middleware logging
- Catat bahwa userId di-log via `logHash()` (hash sha256 16 karakter pertama)

## File yang akan dibuat/diubah

| File | Action | Deskripsi |
|---|---|---|
| `middleware.ts` | **Create** | Middleware logging utama |
| `lib/token-context.ts` | **Read-only** | Sudah ada `als` yang bisa diakses |
| `AGENTS.md` | **Update** | Dokumentasi middleware logging |

## Detail Teknis Middleware

```typescript
// middleware.ts — draft
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logHash, logger } from '@/lib/logger'
import { als } from '@/lib/token-context'

export function middleware(request: NextRequest) {
  const start = Date.now()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const method = request.method
  const pathname = request.nextUrl.pathname

  // Lanjutkan request, dapatkan response
  const response = NextResponse.next()

  const durationMs = Date.now() - start
  const status = response.status
  const store = als.getStore()
  const userIdHash = store?.userId ? logHash(String(store.userId)) : null

  const logPayload = {
    method,
    pathname,
    status,
    durationMs,
    ip,
    userAgent,
    userIdHash,
  }

  if (status >= 400) {
    logger.warn(logPayload, 'http_request_warn')
  } else {
    logger.info(logPayload, 'http_request')
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

## Catatan

- Middleware hanya untuk `'/api/:path*'` — tidak perlu log request ke halaman Next.js (static files, pages)
- Tidak perlu blocking logger — middleware tidak await, log dikirim async
- Body request tidak pernah di-log sama sekali
- Status >= 400 di-log sebagai `warn` agar mudah difilter di Pino
- `userIdHash` menggunakan `logHash()` (sha256 16 karakter pertama) — memberikan konteks audit tanpa mengekspos userId mentah
- IP tetap di-log mentah karena diperlukan untuk deteksi anomaly; jika dianggap PII, bisa di-hash nanti

## Risiko

- **False positive** — status 400 dari Zod validation akan tercatat sebagai warn; ini normal dan diinginkan untuk monitoring validasi
- **Performa** — `Date.now()` dan log fire-and-forget sangat ringan; overhead tidak signifikan
- **User-Agent bisa panjang** — Pino default unbounded; tidak perlu truncation karena contoh praktik yang baik

## Verifikasi

- `npm run lint` — tidak ada error
- `npm run build` — build sukses
- Manual test: akses beberapa endpoint API, pastikan log muncul (stdout/file)
- Verifikasi bahwa body request tidak terbaca di log
