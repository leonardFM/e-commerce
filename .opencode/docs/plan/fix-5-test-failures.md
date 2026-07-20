# Plan: Perbaikan 5 Test Gagal

Berdasarkan hasil investigasi `prompt.txt`, ada 5 test gagal yang tersisa setelah perbaikan checkout 500 (kolom `productName` di database test).

---

## 1. Auth — Rate Limit Register (429)

| | |
|---|---|
| **Akar masalah** | Redis tersedia (`REDIS_URL` dari `.env`). Key `rate-limit:register:unknown` di Redis tidak pernah dibersihkan antar test run, sehingga kuota 3/jam habis. |
| **Perbaikan** | Tambah pembersihan key `rate-limit:*` di Redis pada `resetDatabase()` di `tests/helpers/db.ts` |
| **Kode** | `import { getRedis } from '@/lib/redis'` lalu `const redis = getRedis(); if (redis) { const keys = await redis.keys('rate-limit:*'); if (keys.length > 0) await redis.del(...keys) }` |
| **File** | `tests/helpers/db.ts` |
| **Risiko** | Rendah. Hanya membersihkan key rate-limit, tidak memengaruhi data lain. |

## 2. Auth — Path Params (401→400)

| | |
|---|---|
| **Akar masalah** | Test `returns 400 for invalid path params` tidak mengirim token auth padahal admin sudah di-login di baris sebelumnya. Route menjalankan `requireUser()` dulu sehingga mendapat 401. |
| **Perbaikan** | Tambah `token: admin.token` di 3 request pemanggilan route. |
| **File** | `tests/integration/auth.test.ts:181,184,187` |
| **Perubahan** | `createJsonRequest('/api/products/abc')` → `createJsonRequest('/api/products/abc', { token: admin.token })` (sama untuk `id: '0'` dan `id: '-1'`) |
| **Risiko** | Sangat rendah. Hanya test assertion. |

## 3. Orders — State Transition PAID→COMPLETED (409)

| | |
|---|---|
| **Akar masalah** | Test mencoba transisi `PAID → COMPLETED`, tapi state machine hanya mengizinkan `PAID → PROCESSING → SHIPPED → COMPLETED`. |
| **Perbaikan** | Ikuti transisi valid setelah payment: `PAID → PROCESSING` (200), `PROCESSING → SHIPPED` (200), `SHIPPED → COMPLETED` (200), lalu regression `COMPLETED → PENDING` (409). |
| **File** | `tests/integration/orders.test.ts:86-98` |
| **Risiko** | Sangat rendah. Hanya test yang diperbaiki. |

## 4. Products — XSS Sanitization

| | |
|---|---|
| **Akar masalah** | `sanitize()` menghapus tag HTML → `name` menjadi `''`. Test mengharapkan nilai mentah `<img src=x onerror=alert(1)>`. |
| **Perbaikan** | Restrukturasi schema agar validasi min-length berjalan SETELAH sanitasi menggunakan `.pipe()`. Input XSS akan ditolak dengan 400. |
| **File 1** | `modules/products/product.schema.ts` — tambah `.pipe(z.string().min(1))` setelah `.transform(sanitize)` |
| **File 2** | `tests/integration/products.test.ts:133-134` — expect `400` bukan `201` |
| **Risiko** | Rendah. Nama produk yang setelah sanitasi kosong ditolak, bukan disimpan. |

## Ringkasan File yang Diubah

| No | File | Jenis Perubahan |
|----|------|----------------|
| 1 | `tests/helpers/db.ts` | Tambah Redis cleanup |
| 2 | `tests/integration/auth.test.ts` | Tambah token di 3 request |
| 3 | `tests/integration/orders.test.ts` | Ikuti state machine valid |
| 4 | `modules/products/product.schema.ts` | Tambah `.pipe()` post-sanitasi |
| 5 | `tests/integration/products.test.ts` | Expect 400 untuk XSS input |

## Verifikasi

Setelah implementasi, jalankan:
```bash
npm run test:integration
```

Semua 30 test integration harus lulus (0 failed).
