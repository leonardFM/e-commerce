# Marketplace Homepage And SB Admin Dashboard Redesign Plan

## Goal

Ubah keseluruhan desain UI aplikasi menjadi lebih modern dan konsisten:

- Homepage `/` dibuat dengan gaya marketplace retail terang yang terinspirasi dari ruparupa.com.
- Admin dashboard `/admin` dibuat dengan gaya dashboard seperti SB Admin.
- Customer dashboard `/customer` ikut disesuaikan agar konsisten dengan desain marketplace.
- Perubahan fokus pada tampilan dan layout, tanpa mengubah API, auth flow, database, atau business logic.

## Scope

### Homepage

Ubah `app/page.tsx` menjadi layout marketplace terang:

- Top promo bar.
- Header dengan logo, search-style bar, dan link ke dashboard customer/admin.
- Hero banner promo retail dengan CTA belanja.
- Kategori cepat bergaya marketplace.
- Benefit/service strip.
- Grid produk dengan kartu ecommerce: thumbnail block, badge stok, harga menonjol, dan CTA.
- CTA bawah untuk admin/customer.
- Tetap mengambil featured products server-side dari service existing.

### Admin Dashboard

Ubah struktur visual `app/admin/page.tsx` agar mirip SB Admin:

- Sidebar biru gelap dengan brand, navigasi, session info, dan logout.
- Topbar putih dengan search dan ringkasan dashboard.
- Metric cards dengan accent border dan shadow ringan.
- Product table bergaya admin template.
- Catalog editor, recent orders, dan inventory audit dalam panel/card dashboard.
- Login admin dibuat seperti halaman auth admin modern.
- Pertahankan semua handler dan API client existing.

### Customer Dashboard

Ubah `app/customer/page.tsx` agar selaras dengan desain marketplace:

- Dashboard katalog terang.
- Sticky cart/checkout panel seperti checkout sidebar marketplace.
- Product cards mengikuti gaya homepage.
- Order history dibuat sebagai clean card/list.
- Login customer modern.
- Pertahankan cart, checkout, order history, dan auth behavior existing.

### Global CSS

Rewrite/rapikan `app/globals.css`:

- Ganti tema dominan dari dark glassmorphism ke light ecommerce/admin theme.
- Tambahkan class untuk marketplace header, hero, kategori, dashboard shell, sidebar, topbar, metric cards, table, form, cart, dan orders.
- Pertahankan class existing bila masih dipakai supaya perubahan TSX tetap minimal.
- Pastikan responsive mobile untuk header, grid, sidebar, dashboard, dan cart.

### Metadata

Evaluasi `app/layout.tsx`:

- Update metadata hanya jika diperlukan untuk menyesuaikan positioning produk/desain.
- Jangan ubah behavior layout root jika tidak diperlukan.

## Files Expected To Change

- `app/page.tsx`
- `app/admin/page.tsx`
- `app/customer/page.tsx`
- `app/globals.css`
- `app/layout.tsx` jika metadata perlu disesuaikan
- `.opencode/docs/implement/<implementation-note>.md` setelah implementasi selesai

## Non-Goals

- Tidak menambah dependency UI baru.
- Tidak mengubah endpoint API.
- Tidak mengubah auth/RBAC behavior.
- Tidak mengubah Prisma schema, seed, migration, atau SQL.
- Tidak mengubah service/repository business logic.
- Tidak membuat desain pixel-perfect clone; desain hanya mengambil arah visual marketplace ruparupa dan dashboard SB Admin.

## Implementation Steps

1. Redesign homepage `/` di `app/page.tsx` dengan struktur marketplace.
2. Redesign admin dashboard `/admin` di `app/admin/page.tsx` dengan struktur SB Admin, sambil mempertahankan state, handler, dan API calls existing.
3. Redesign customer dashboard `/customer` di `app/customer/page.tsx` agar mengikuti visual marketplace dan checkout sidebar modern.
4. Rewrite/rapikan `app/globals.css` untuk light theme, marketplace UI, dashboard UI, forms, tables, status messages, dan responsive behavior.
5. Evaluasi `app/layout.tsx`; ubah metadata bila relevan.
6. Buat catatan implementasi di `.opencode/docs/implement/` setelah perubahan selesai.
7. Evaluasi apakah `AGENTS.md` perlu diupdate. Kemungkinan tidak perlu karena perubahan hanya UI.

## Verification Plan

Jalankan minimal:

```bash
npm run lint
```

Jika memungkinkan, jalankan juga:

```bash
npm run build
```

Manual smoke test yang perlu dilakukan bila server dan database tersedia:

- Buka homepage `/` dan cek layout desktop/mobile.
- Login admin di `/admin`, cek sidebar, metrics, product table, editor, orders, dan inventory audit.
- Login customer di `/customer`, cek katalog, cart, checkout panel, dan order history.
- Cek RBAC UI tetap menolak role yang salah.

## Risks And Follow-Up

- Karena tidak memakai image asset eksternal, product thumbnail kemungkinan tetap berupa visual block/initials sampai ada data image produk.
- Layout admin/customer bergantung pada jumlah data dari API; perlu dicek dengan data seed dan data kosong.
- Perubahan CSS global cukup luas, sehingga perlu build/lint dan smoke test UI untuk memastikan tidak ada class yang terlewat.
