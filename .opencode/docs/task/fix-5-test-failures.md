# Task: Perbaikan 5 Test Gagal Integration

**Source plan:** `.opencode/docs/plan/fix-5-test-failures.md`

**Dibuat:** 2026-07-19

---

## Task 1: Redis Cleanup di resetDatabase

**Masalah:** Key `rate-limit:*` di Redis tidak pernah dibersihkan antar test, menyebabkan register rate limit (3/jam) habis.

**File:** `tests/helpers/db.ts`

**Perubahan:**
- Import `getRedis` dari `@/lib/redis`
- Di dalam `resetDatabase()`, setelah truncate tabel, tambah:

```typescript
const redis = getRedis()
if (redis) {
  const keys = await redis.keys('rate-limit:*')
  if (keys.length > 0) await redis.del(...keys)
}
```

**Verifikasi:** Test auth parallel duplicate register mendapat `[201, 409]` bukan `[429, 429]`.

---

## Task 2: Fix Auth Path Params Test

**Masalah:** Test tidak mengirim token, route menjalankan `requireUser()` dulu → 401.

**File:** `tests/integration/auth.test.ts`

**Perubahan (baris 179-191):**
- Login admin: `const admin = await loginAsAdmin()`
- Baris 181: `createJsonRequest('/api/products/abc')` → `createJsonRequest('/api/products/abc', { token: admin.token })`
- Baris 184: `createJsonRequest('/api/products/0')` → `createJsonRequest('/api/products/0', { token: admin.token })`
- Baris 187: `createJsonRequest('/api/products/-1')` → `createJsonRequest('/api/products/-1', { token: admin.token })`
- Baris 190: request ke `/api/orders/abc` sudah pakai `{ token: admin.token }` — tidak perlu diubah.

**Verifikasi:** Test `returns 400 for invalid path params` mendapat 400.

---

## Task 3: Fix Orders State Transition Test

**Masalah:** Test mencoba PAID → COMPLETED (invalid). State machine: PAID → PROCESSING → SHIPPED → COMPLETED.

**File:** `tests/integration/orders.test.ts`

**Perubahan (baris 86-98):**
Setelah payment PAID, ubah update status menjadi:

```typescript
const processResponse = await updateOrderStatusRoute(createJsonRequest(
  `/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    token: admin.token,
    body: { status: 'PROCESSING' },
  }), { params: Promise.resolve({ id: String(orderId) }) })
expect(processResponse.status).toBe(200)

const shippedResponse = await updateOrderStatusRoute(createJsonRequest(
  `/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    token: admin.token,
    body: { status: 'SHIPPED' },
  }), { params: Promise.resolve({ id: String(orderId) }) })
expect(shippedResponse.status).toBe(200)

const completedResponse = await updateOrderStatusRoute(createJsonRequest(
  `/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    token: admin.token,
    body: { status: 'COMPLETED' },
  }), { params: Promise.resolve({ id: String(orderId) }) })
expect(completedResponse.status).toBe(200)

const regressResponse = await updateOrderStatusRoute(createJsonRequest(
  `/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    token: admin.token,
    body: { status: 'PENDING' },
  }), { params: Promise.resolve({ id: String(orderId) }) })
expect(regressResponse.status).toBe(409)
```

**Verifikasi:** Test `allows admin to list orders and update payment/status` mendapat 200 untuk PROCESSING, SHIPPED, COMPLETED, dan 409 untuk regression.

---

## Task 4a: Fix Product Schema — Post-Sanitasi Validasi

**Masalah:** `sanitize()` menghapus tag HTML setelah `.min(1)` lolos, sehingga nama menjadi `''`.

**File:** `modules/products/product.schema.ts`

**Perubahan:**
```typescript
// dari:
name: z.string().trim().min(1).max(120).transform(sanitize),

// menjadi:
name: z.string().trim().min(1).max(120).transform(sanitize)
      .pipe(z.string().min(1, 'Product name cannot be empty after sanitization')),
```

**Verifikasi:** Input `<img src=x onerror=alert(1)>` ditolak dengan 400.

---

## Task 4b: Fix Products XSS Test

**Masalah:** Test mengharapkan 201 dengan nama mentah, tapi seharusnya 400 (invalid setelah sanitasi).

**File:** `tests/integration/products.test.ts`

**Perubahan (baris 133-134):**
```typescript
// dari:
expect(xssProduct.response.status).toBe(201)
expect(xssProduct.payload.data.name).toBe(xssName)

// menjadi:
expect(xssProduct.response.status).toBe(400)
```

**Verifikasi:** Test `hardens product input and search against oversized and injection-like payloads` mendapat 400.

---

## Task 5: Update AGENTS.md

**Alasan:** Plan ini menambahkan ketergantungan pada Redis di test helper (`resetDatabase` kini berinteraksi dengan Redis). Jika AGENTS.md tidak mencatat hal ini, developer tidak tahu bahwa test environment kini membutuhkan Redis untuk test isolation yang bersih.

**File:** `AGENTS.md`

**Perubahan yang perlu dievaluasi:**
- Apakah perlu ditambahkan catatan bahwa test integration menggunakan Redis untuk rate-limit dan bahwa `resetDatabase` membersihkan key `rate-limit:*`?
- Apakah perlu dicatat bahwa `REDIS_URL` memengaruhi test behavior (rate limit isolation)?

---

## Verifikasi Akhir

```bash
npm run test:integration
```

Semua 30 test integration harus lulus (0 failed).
