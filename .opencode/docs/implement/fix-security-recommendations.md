# Implementasi: Perbaikan Rekomendasi Keamanan

**Dibuat:** 2026-07-19

---

## Ringkasan Perubahan

### 1. Harmonisasi Password minLength

- **File:** `app/register/page.tsx:68`
- **Perubahan:** `minLength={6}` → `minLength={10}`
- **Sebab:** Server Zod schema mensyaratkan `min(10)`, client HTML5 `minLength={6}` menyebabkan user bisa submit password 6-9 karakter hanya untuk ditolak server.
- **Verifikasi:** Build sukses, test register pass.

### 2. Aktifkan reactStrictMode

- **File:** `next.config.mjs:15`
- **Perubahan:** `reactStrictMode: false` → `reactStrictMode: true`
- **Dampak:** Development mode akan mendeteksi unsafe lifecycle, deprecated API, dan side-effect ganda. Tidak ada efek di production.
- **Verifikasi:** Build sukses tanpa warning.

### 3. Ganti `Math.random()` ke `crypto.randomUUID()`

- **File:** `modules/payments/payment.service.ts:4-8`
- **Perubahan:**
  - Import `randomUUID` dari `crypto`
  - `generatePaymentReference()` menggunakan `PAY-${randomUUID()}` bukan `PAY-${Date.now()}-${Math.random().toString(36)}`
- **Sebab:** `Math.random()` bukan cryptographic PRNG; `randomUUID()` menghasilkan UUID v4 yang unpredictable.
- **Verifikasi:** 51/51 test lulus.

### 4. Hentikan Increment Rate Limit pada Duplicate Register

- **File:** `modules/auth/auth.service.ts:100,115`
- **Perubahan:** Hapus 2 panggilan `incrementFailedLoginRateLimit` di path duplicate email (find + P2002 race)
- **Sebab:** Percobaan register berulang untuk email yang sudah ada seharusnya tidak menghabiskan kuota rate limit IP — legitimate user dari IP yang sama jadi terblokir.
- **Risiko:** Rendah. Duplicate email sudah ditolak dengan 409, base rate limit register (3/IP/jam) tetap aktif. Tanpa increment di path duplicate, rate limit hanya naik jika ada request dengan email baru.
- **Verifikasi:** Test parallel duplicate register masih mendapat `[201, 409]`.

---

## File yang Diubah

| No | File | Perubahan |
|----|------|-----------|
| 1 | `app/register/page.tsx` | `minLength={6}` → `{10}` |
| 2 | `next.config.mjs` | `reactStrictMode: false` → `true` |
| 3 | `modules/payments/payment.service.ts` | `Math.random()` → `crypto.randomUUID()` |
| 4 | `modules/auth/auth.service.ts` | Hapus 2 `incrementFailedLoginRateLimit` di path duplicate |

## Verifikasi

```bash
npm run build              # Build sukses
npm run test               # 21 unit tests lulus
npm run test:integration   # 30 integration tests lulus
```

**Total: 51/51 test lulus.**
