# Implementasi: Perbaikan 5 Test Gagal Integration

**Referensi plan:** `.opencode/docs/plan/fix-5-test-failures.md`
**Referensi task:** `.opencode/docs/task/fix-5-test-failures.md`
**Dibuat:** 2026-07-19

---

## Ringkasan Perubahan

Perbaikan 5 kegagalan test integration yang tersisa setelah perbaikan checkout 500 (kolom `productName`).

### 1. Redis Cleanup di `resetDatabase()`

- **File:** `tests/helpers/db.ts`
- **Perubahan:** Import `getRedis` dari `@/lib/redis`, tambah cleanup key `rate-limit:*` setelah truncate tabel
- **Tujuan:** Mencegah rate limit register/login test habis antar test run karena key Redis persist
- **Fail-open:** Jika Redis tidak tersedia atau error, cleanup di-skip (tidak mengganggu test)

### 2. Auth Path Params — Tambah Token

- **File:** `tests/integration/auth.test.ts`
- **Perubahan:** Tambah `{ token: admin.token }` di 3 request ke `/api/products/abc`, `/api/products/0`, `/api/products/-1`
- **Sebab:** Test login admin tapi tidak mengirim token; route menjalankan `requireUser()` dulu → 401

### 3. Orders State Transition — Ikuti State Machine

- **File:** `tests/integration/orders.test.ts`
- **Perubahan:** Ganti `PAID → COMPLETED` (invalid) menjadi `PAID → PROCESSING → SHIPPED → COMPLETED` (valid), lalu regression `COMPLETED → PENDING` (409)
- **Sebab:** State machine hanya mengizinkan `PAID → PROCESSING → SHIPPED → COMPLETED`

### 4a. Product Schema — Post-Sanitasi Validasi

- **File:** `modules/products/product.schema.ts`
- **Perubahan:** Tambah `.pipe(z.string().min(1))` setelah `.transform(sanitize)`
- **Dampak:** Input XSS seperti `<img src=x...>` kini ditolak dengan 400 (sebelumnya disimpan sebagai string kosong)

### 4b. Products XSS Test — Expect 400

- **File:** `tests/integration/products.test.ts`
- **Perubahan:** Expect `400` bukan `201`, dan `error: 'Validation error'`
- **Sebab:** Schema menolak nama produk yang setelah sanitasi menjadi kosong

---

## File yang Diubah

| No | File | Perubahan |
|----|------|-----------|
| 1 | `tests/helpers/db.ts` | + Redis cleanup |
| 2 | `tests/integration/auth.test.ts` | + token di 3 request |
| 3 | `tests/integration/orders.test.ts` | Ikuti state machine valid |
| 4 | `modules/products/product.schema.ts` | + `.pipe(z.string().min(1))` |
| 5 | `tests/integration/products.test.ts` | Expect 400 untuk XSS |

## Verifikasi

```bash
npm run test             # 21 unit tests lulus
npm run test:integration # 30 integration tests lulus
npm run build            # Build sukses
```

**Hasil:** 30/30 integration test, 21/21 unit test — semua lulus.

## Risiko / Follow-up

- **Rendah.** Redis cleanup di `resetDatabase()` hanya membersihkan key `rate-limit:*`, fail-open jika Redis tidak tersedia.
- **Rendah.** `.pipe(z.string().min(1))` di product schema — hanya memengaruhi input yang setelah sanitasi menjadi kosong (XSS), tidak memengaruhi input normal.
- Jika ada Redis yang digunakan bersama environment lain, key `rate-limit:*` test akan ikut terhapus — risikonya minimal karena key test hanya untuk IP `unknown`.
