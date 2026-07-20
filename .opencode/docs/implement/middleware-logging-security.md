# Middleware Logging for Security Monitoring (Rolled Back)

## Ringkasan

Percobaan membuat `middleware.ts` dan `lib/request-log.ts` untuk logging request terpusat, lalu di-rollback karena Next.js 16.2.10 sudah menyediakan built-in request logging.

## Kenapa Dirollback

1. **Next.js 16 built-in logging**: Format `{method} {path} {status} in {duration}ms (next.js: Xms, proxy.ts: Xms, application-code: Xms)` sudah mencakup status, duration, dan timing breakdown.
2. **Middleware deprecated**: Next.js 16 mendeprecate `middleware.ts` menjadi `proxy.ts`.
3. **Edge Runtime constraint**: Pino tidak support Edge Runtime, middleware terpaksa pakai `console.log`.
4. **Double logging**: Middleware + Next.js built-in = log ganda untuk setiap request.

## File yang Berubah (Final State)

| File | Action | Keterangan |
|---|---|---|
| `middleware.ts` | **Create then Delete** | Tidak ada middleware |
| `lib/request-log.ts` | **Create then Delete** | Tidak ada request-log helper |
| `lib/response.ts` | **Edit then Revert** | Kembali ke `success<T>(data, status?)` |
| `lib/token-context.ts` | **Edit (kept)** | `userId` di `TokenContext`, `getUserId()`, `setUserId()` tetap ada |
| `lib/request.ts` | **Edit (kept)** | `setUserId(dbUser.id)` di `requireUser()` tetap ada |
| `AGENTS.md` | **Edit → Final** | Section "Request Logging" — catat Next.js built-in |

## Yang Tersisa (`lib/token-context.ts` + `lib/request.ts`)

Perubahan `setUserId` di `requireUser()` dan `userId` di `TokenContext` tetap dipertahankan karena bisa berguna untuk konteks lain di masa depan (misal akses userId dari service tanpa perlu parsing token ulang). Tidak ada efek negatif — `als.enterWith({})` tetap berjalan seperti sebelumnya.

## Verifikasi

- `npm run lint` — 0 error (5 warnings pre-existing)
- `npm run build` — sukses, 0 deprecation, 0 Edge warnings
- Route listing: tidak ada `Proxy (Middleware)` — bersih
