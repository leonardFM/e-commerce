# Sanitize HTML Defense-in-Depth Plan

## Goal

Menambahkan `sanitize-html` sebagai lapisan pertahanan tambahan (defense-in-depth) untuk mencegah stored XSS jika suatu saat data user-generated dirender sebagai HTML.

## Current Assessment

Saat ini:
- ✅ Zod sudah `trim()` dan `max()` pada semua input string
- ✅ API response JSON, bukan HTML
- ✅ UI menggunakan JSX `{variable}` (auto-escape)
- ❌ Tidak ada sanitasi HTML pada input strings
- ❌ Library `sanitize-html` belum terinstall

## Scope

1. Install `sanitize-html` dependency + types
2. Buat `lib/sanitize.ts` helper
3. Terapkan di Zod schema via `.transform()` pada semua string input publik/admin
4. Update AGENTS.md

## Out Of Scope

- Password field — tidak perlu di-sanitize (langsung di-hash)
- Search query — sudah di-trim + max(120), risiko XSS rendah
- Error message — sudah di-handle oleh `failure()` (ZodError sanitasi)
- `dangerouslySetInnerHTML` — sudah tidak ada di codebase

---

## Phase 1: Install Dependency

```bash
npm install sanitize-html
npm install -D @types/sanitize-html
```

## Phase 2: Sanitize Helper

Buat `lib/sanitize.ts`:

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

Di `lib/sanitize.ts`, tambahkan Zod transform builder:

```typescript
import { z } from 'zod'

export function sanitizedString() {
  return z.string().transform((val) => sanitize(val))
}
```

## Phase 4: Apply to Schemas

Tambahkan `.pipe(sanitizedString())` atau `.transform(sanitize)` ke semua string field di Zod schema:

### `modules/products/product.schema.ts`

```typescript
// Sebelum:
name: z.string().trim().min(1).max(120),
description: z.string().trim().max(500).nullable().optional(),
search: z.string().trim().max(120).optional(),

// Sesudah:
name: z.string().trim().min(1).max(120).transform(sanitize),
description: z.string().trim().max(500).nullable().optional().transform((v) => v ? sanitize(v) : v),
search: z.string().trim().max(120).optional().transform((v) => v ? sanitize(v) : v),
```

### `modules/checkout/checkout.schema.ts`

```typescript
// Semua shipping fields:
shippingName: z.string().trim().min(1).max(120).transform(sanitize),
shippingPhone: z.string().trim().min(5).max(30).transform(sanitize),
shippingAddress: z.string().trim().min(1).max(500).transform(sanitize),
shippingCity: z.string().trim().min(1).max(120).transform(sanitize),
shippingPostalCode: z.string().trim().min(1).max(20).transform(sanitize),
```

### `modules/auth/auth.schema.ts`

```typescript
// name (opsional, nullable)
name: z.string().trim().max(100).optional().transform((v) => v ? sanitize(v) : v),

// email: sanitize dulu sebelum lowercase + email validation
email: z.string().trim().transform(sanitize).toLowerCase().email().max(254),

// password: TIDAK di-sanitize (langsung di-hash, special characters penting)
password: z.string().min(10).max(128),
```

### `modules/inventory/inventory.schema.ts`

```typescript
note: z.string().trim().max(500).optional().transform((v) => v ? sanitize(v) : v),
```

## Files Affected

| File | Change |
|------|--------|
| `package.json` | Tambah `sanitize-html` + `@types/sanitize-html` |
| `lib/sanitize.ts` | File baru — sanitize helper + Zod transform |
| `modules/products/product.schema.ts` | `.transform(sanitize)` di name, description, search |
| `modules/checkout/checkout.schema.ts` | `.transform(sanitize)` di 5 shipping fields |
| `modules/auth/auth.schema.ts` | `.transform(sanitize)` di email, name |
| `modules/inventory/inventory.schema.ts` | `.transform(sanitize)` di note |
| `AGENTS.md` | Tambah catatan tentang sanitize-html |

## Verification

- [ ] `npm run lint` — 0 errors baru
- [ ] `npm run build` — build sukses
- [ ] `npm run test` — unit test lulus
- [ ] Manual: input `<script>alert(1)</script>` di product name → tersimpan sebagai `alert(1)` (tag ter-strip)
- [ ] Manual: input normal `Product A` → tetap `Product A` (tidak berubah)
- [ ] Manual: input kosong/null → tetap null/kosong
- [ ] Pastikan shipping phone dengan karakter `+` atau `-` tetap valid

## Risiko

- `.transform()` di Zod mengubah tipe output. Pastikan tidak ada type mismatch antara schema dan service.
- Karakter `&`, `<`, `>`, `"` di input akan diubah ke bentuk aman (di-strip). Jika ada user yang memasukkan karakter ini sebagai bagian legitimate dari input (misal shipping address `Jln. Sudirman No. 5 <Gedung A>`), akan diubah menjadi `Jln. Sudirman No. 5 Gedung A`. Ini acceptable untuk defense-in-depth.
- `sanitize-html` adalah library dengan ukuran cukup besar. Jika bundle size concern, bisa dipertimbangkan alternatif seperti `strip-html` (lebih ringan) untuk kasus penggunaan sederhana.

## Alternatif yang Dipertimbangkan

1. **`strip-html`** — lebih ringan (2KB vs 200KB+), hanya strip tags tanpa konfigurasi. Cukup untuk use case saat ini.
2. **Regex sederhana** — `val.replace(/<[^>]*>/g, '')` — paling ringan tapi kurang robust untuk edge cases.
3. **DOMPurify** — lebih berat, biasanya untuk client-side.

**Rekomendasi:** Gunakan `sanitize-html` karena sudah mature, well-maintained, dan memberikan fleksibilitas jika di masa depan ada fields yang perlu mengizinkan HTML terbatas.
