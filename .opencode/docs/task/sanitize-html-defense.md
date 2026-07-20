# Task: Sanitize HTML Defense-in-Depth

Source plan: `.opencode/docs/plan/sanitize-html-defense-plan.md`

> Menambahkan `sanitize-html` sebagai lapisan pertahanan tambahan (defense-in-depth) terhadap stored XSS.

---

## Phase 1: Install Dependency

- [ ] Jalankan:
  ```bash
  npm install sanitize-html
  npm install -D @types/sanitize-html
  ```

## Phase 2: Buat Sanitize Helper

- [ ] Buat `lib/sanitize.ts`:

```typescript
import sanitizeHtml from 'sanitize-html'

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  allowedSchemes: [],
  disallowedTagsMode: 'discard',
  stripNonNativeWhitespace: true,
}

export function sanitize(value: string): string {
  return sanitizeHtml(value, SANITIZE_OPTIONS).trim()
}
```

## Phase 3: Zod Transform Helper

- [ ] Tambahkan di `lib/sanitize.ts` (import `z` dari zod):

```typescript
import { z } from 'zod'
// ... existing sanitize function ...

export function sanitizedString() {
  return z.string().transform((val) => sanitize(val))
}
```

## Phase 4: Apply to Zod Schemas

### 4.1 `modules/products/product.schema.ts`

- [ ] Tambah import `sanitize` dari `@/lib/sanitize`
- [ ] Ubah `name` — tambah `.transform(sanitize)` setelah `.max(120)`
- [ ] Ubah `description` — tambah `.transform((v) => v ? sanitize(v) : v)` setelah `.optional()`
- [ ] Ubah `search` — tambah `.transform((v) => v ? sanitize(v) : v)` setelah `.optional()`

### 4.2 `modules/checkout/checkout.schema.ts`

- [ ] Tambah import `sanitize` dari `@/lib/sanitize`
- [ ] Ubah `shippingName` — tambah `.transform(sanitize)` setelah `.max(120)`
- [ ] Ubah `shippingPhone` — tambah `.transform(sanitize)` setelah `.max(30)`
- [ ] Ubah `shippingAddress` — tambah `.transform(sanitize)` setelah `.max(500)`
- [ ] Ubah `shippingCity` — tambah `.transform(sanitize)` setelah `.max(120)`
- [ ] Ubah `shippingPostalCode` — tambah `.transform(sanitize)` setelah `.max(20)`

### 4.3 `modules/auth/auth.schema.ts`

- [ ] Tambah import `sanitize` dari `@/lib/sanitize`
- [ ] Ubah `email` — tambah `.transform(sanitize)` setelah `.trim()`, sebelum `.toLowerCase()`
- [ ] Ubah `name` — tambah `.transform((v) => v ? sanitize(v) : v)` setelah `.optional()`
- [ ] Pastikan `password` **tidak** diubah

### 4.4 `modules/inventory/inventory.schema.ts`

- [ ] Tambah import `sanitize` dari `@/lib/sanitize`
- [ ] Ubah `note` — tambah `.transform((v) => v ? sanitize(v) : v)` setelah `.optional()`

## Phase 5: Update AGENTS.md

- [ ] Tambah catatan di bagian **Architecture Rules** atau **Auth And Security** bahwa semua string input publik/admin di-sanitize dengan `sanitize-html` (strip all tags) di Zod schema layer.

---

## Verification

- [ ] `npm run lint` — 0 errors baru
- [ ] `npm run build` — build sukses
- [ ] `npm run test` — unit test lulus
- [ ] Manual: input `<script>alert(1)</script>` di product name → tersimpan sebagai `alert(1)`
- [ ] Manual: input normal `Product A` → tetap `Product A`
- [ ] Manual: input kosong/null → tetap null/kosong
- [ ] Pastikan shipping phone dengan karakter `+` atau `-` tetap valid

## Follow-up

- [ ] Buat implementation notes di `.opencode/docs/implement/` setelah implementasi selesai
