# SQL Injection and XSS Hardening Plan

## Background

Audit awal menunjukkan application code tidak memiliki raw SQL dinamis dan tidak memakai sink XSS langsung seperti `dangerouslySetInnerHTML`, `innerHTML`, `eval`, atau HTML parser. Akses database mayoritas memakai Prisma ORM, dan raw SQL yang ada di checkout memakai Prisma tagged template parameterized.

Risiko yang tersisa adalah hardening input/output:

- Beberapa string input belum memakai `trim()` dan batas panjang eksplisit.
- Search query aman dari SQL injection, tetapi belum dibatasi panjangnya.
- Beberapa pesan error API memantulkan nama produk dari database.
- Belum ada defense-in-depth berupa security headers/CSP yang eksplisit.

## Goals

- Memperketat validasi input untuk mengurangi risiko stored/reflected XSS dan abuse payload besar.
- Memastikan semua query database tetap parameterized melalui Prisma.
- Mengurangi data user/admin-generated yang dipantulkan dalam pesan error API.
- Menambahkan verifikasi otomatis atau manual untuk payload SQL injection dan XSS dasar.
- Menjaga perubahan minimal dan tetap mengikuti layering route/schema/service/repository.

## Non-Goals

- Tidak menambahkan HTML sanitizer global kecuali ada kebutuhan render rich text.
- Tidak mengubah struktur database kecuali validasi membutuhkan constraint persistensi baru.
- Tidak mengganti ORM atau pola repository yang sudah ada.
- Tidak mengubah desain UI.

## Current Findings

### SQL Injection

- Aman: repository memakai Prisma object query (`where`, `orderBy`, `findMany`, `create`, `update`, `transaction`).
- Aman: `modules/checkout/checkout.repository.ts` memakai `$executeRaw` tagged template untuk `pg_advisory_xact_lock(${userId})`.
- Aman untuk production: `$executeRawUnsafe` hanya ditemukan di helper test dengan SQL statis.

### XSS

- Aman: UI React merender data dengan JSX interpolation sehingga string di-escape otomatis.
- Aman: tidak ada `dangerouslySetInnerHTML` atau direct DOM HTML injection di app source.
- Perlu hardening: input string dari product, checkout, inventory note, search, email, dan password belum konsisten memiliki trim/max length.
- Perlu hardening: error stok menampilkan `product.name` dari database.

## Implementation Plan

### 1. Tighten Zod String Validation

Update schema domain agar input string dinormalisasi dan dibatasi panjangnya.

Target files:

- `modules/products/product.schema.ts`
- `modules/checkout/checkout.schema.ts`
- `modules/inventory/inventory.schema.ts`
- `modules/auth/auth.schema.ts`

Recommended validation:

- Product `name`: `trim()`, `min(1)`, `max(120)`.
- Product `description`: `trim()`, `max(500)`, nullable/optional tetap dipertahankan.
- Product `search`: `trim()`, `max(120)`, optional.
- Checkout `shippingName`: `trim()`, `min(1)`, `max(120)`.
- Checkout `shippingPhone`: `trim()`, `min(5)`, `max(30)`.
- Checkout `shippingAddress`: `trim()`, `min(1)`, `max(500)`.
- Checkout `shippingCity`: `trim()`, `min(1)`, `max(120)`.
- Checkout `shippingPostalCode`: `trim()`, `min(1)`, `max(20)`.
- Inventory `note`: `trim()`, `max(500)`, optional.
- Auth `email`: `trim()`, `toLowerCase()`, `email()`, `max(254)`.
- Auth `password`: `min(6)`, `max(128)`.

Notes:

- Do not strip or escape HTML before storing; React already escapes output. Store plain user input and validate size/shape.
- Avoid adding sanitizer unless rich HTML rendering is introduced later.

### 2. Stop Reflecting Product Names In API Errors

Replace product-name-specific stock errors with generic messages.

Target files:

- `modules/checkout/checkout.repository.ts`
- `modules/orders/order.repository.ts`

Current pattern:

```ts
throw new AppError(`Insufficient stock for product ${product.name}`, 409)
```

Recommended pattern:

```ts
throw new AppError('Insufficient stock for one or more products', 409)
```

Reason:

- Prevents user/admin-generated product names from being reflected in API error payloads and logs.
- Keeps client behavior simple because it already displays generic error strings.

### 3. Review Response Error Shape

Target file:

- `lib/response.ts`

Keep current behavior for `ZodError` and `AppError`, but verify no raw request body or sensitive value is logged.

Recommended adjustment only if needed:

- Keep `issues` for validation errors because they describe schema paths and expected types.
- Do not include submitted values in validation errors.
- Keep generic 500 response.

### 4. Add Security Headers Defense-In-Depth

Evaluate adding headers in `next.config` or middleware.

Recommended baseline:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Content-Security-Policy` with conservative defaults if it does not break Next.js runtime.

Suggested CSP starting point for local review:

```text
default-src 'self';
base-uri 'self';
frame-ancestors 'none';
object-src 'none';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
connect-src 'self';
form-action 'self'
```

Notes:

- Next.js dev and inline styles/scripts may require relaxed directives. Test production build before tightening.
- If CSP causes breakage, start with non-CSP headers first and document CSP as follow-up.

### 5. Add Regression Tests

Target tests:

- Existing integration tests under `tests/integration/**`.
- Add schema unit tests if integration DB is not available.

Recommended cases:

- Product create rejects `name` longer than 120 chars.
- Product search rejects query longer than 120 chars.
- Checkout rejects overly long shipping fields.
- Inventory adjustment rejects note longer than 500 chars.
- SQLi-like search payload such as `' OR 1=1 --` returns normal filtered response, not all products or server error.
- XSS-like product name such as `<img src=x onerror=alert(1)>` is stored/rendered as text and does not require HTML rendering.
- Insufficient stock error does not include raw product name.

## Verification Plan

Run automated checks after implementation:

```bash
npm run lint
npm run test
```

If integration database is configured:

```bash
npm run test:integration
```

Manual API smoke checks:

- Login as admin.
- Try creating product with long name and verify HTTP 400.
- Create product with HTML-like name and verify API returns JSON string, not rendered HTML in UI.
- Search with SQLi-like payload and verify no SQL error and no unexpected records.
- Login as customer, checkout with long shipping address and verify HTTP 400.
- Trigger insufficient stock and verify response error is generic.

Manual UI checks:

- Homepage `/` still renders product cards.
- Admin `/admin/products` still supports create/edit/search.
- Customer `/customer` still supports catalog/cart/checkout.
- Messages containing `<script>` or HTML-like product names appear as text.

## Risks And Tradeoffs

- Trimming input changes persisted values for leading/trailing whitespace. This is desirable for product/search/shipping/auth fields.
- Adding strict CSP can break Next.js scripts/styles if too restrictive. Roll out CSP carefully after build/browser smoke testing.
- Generic stock errors reduce user specificity but improve safety and avoid reflecting stored text in error payloads/logs.

## Follow-Up Considerations

- If the app later supports rich product descriptions, add a dedicated sanitizer and render allowlisted HTML only at the display boundary.
- Consider database-level varchar limits matching Zod limits in a future Prisma migration for stronger persistence guarantees.
- Consider rate limiting or request body size limits if abuse with large payloads becomes a concern.
