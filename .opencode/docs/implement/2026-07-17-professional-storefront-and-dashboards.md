## Ringkasan

- Mengubah homepage menjadi storefront e-commerce profesional dengan navbar, hero, kategori, benefit, produk unggulan, dan CTA ke dashboard customer/admin.
- Meningkatkan dashboard admin dengan layout command center, sidebar, insight cards, editor produk, tabel inventori, dan metrik produk.
- Menambahkan dashboard customer untuk login customer, katalog produk, cart client-side, checkout order, dan riwayat order.
- Menambahkan helper API customer untuk login, product listing, checkout order, dan order history.
- Mengupdate `AGENTS.md` dengan UI routes dan manual testing notes baru.

## File Diubah

- `app/page.tsx`
- `app/admin/page.tsx`
- `app/customer/page.tsx`
- `app/globals.css`
- `lib/customer-api.ts`
- `AGENTS.md`
- `.opencode/docs/task/professional-storefront-and-dashboards.md`

## Verifikasi

- `npm run lint` berhasil.
- `npm run build` berhasil.
- Review subagent auth/security: no blockers.
- Review subagent code: no blockers.
- Review subagent test: no blockers; manual scenario direkomendasikan untuk UI/RBAC/checkout.

## Manual Test Belum Dijalankan

- Homepage tampil baik di desktop dan mobile.
- Login admin berhasil masuk `/admin`.
- Login customer ditolak di `/admin`.
- Login customer berhasil masuk `/customer`.
- Login admin ditolak di `/customer`.
- Customer bisa melihat katalog, menambah cart, checkout, dan melihat order history.
- Admin tetap bisa create, update, dan delete product.

## Risiko / Follow-up

- Cart customer belum persisted karena schema belum memiliki model cart.
- Katalog customer membutuhkan login karena `GET /api/products` saat ini protected.
- Jika storefront publik tanpa login dibutuhkan, buat plan terpisah untuk endpoint product public atau perubahan auth policy.
- Jika order membutuhkan alamat pengiriman, payment, atau status order, perlu perluasan schema dan API order di plan terpisah.
