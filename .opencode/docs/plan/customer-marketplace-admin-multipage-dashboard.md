# Customer Marketplace And Admin Multipage Dashboard Plan

## Goal

Sesuaikan UI dashboard lanjutan agar:

- Customer dashboard `/customer` terlihat seperti homepage marketplace setelah login, dengan card/panel customer di sisi kiri.
- Admin dashboard dipisah menjadi beberapa halaman operasional: overview, products, orders, dan inventory.
- Perubahan tetap fokus pada UI/layout dan client-side organization, tanpa mengubah API, database, Prisma schema, atau business logic backend.

## Scope

### Customer Dashboard Marketplace Layout

Ubah `app/customer/page.tsx` agar setelah login tampil seperti homepage marketplace:

- Gunakan pola visual homepage: promo bar, header brand, search-style input, hero/section katalog, dan product grid marketplace.
- Tambahkan left card/panel setelah login untuk informasi customer dan cart summary.
- Left card minimal berisi session/customer label, total item cart, total cart, shortcut checkout, dan logout.
- Cart/checkout detail tetap tersedia sebagai panel sticky di sisi kiri atau kiri bawah, sementara katalog produk berada di kanan.
- Order history tetap tersedia sebagai card/list yang rapi di bawah katalog.
- Login customer tetap memakai flow dan validasi role existing.
- Pertahankan API client calls existing: login, fetch products, fetch cart, fetch orders, add/update cart item, dan checkout.

### Admin Multipage Dashboard

Pisahkan admin dashboard menjadi route UI terpisah:

- `/admin` sebagai overview/dashboard ringkas.
- `/admin/products` untuk product table, search, pagination, create/edit/delete product.
- `/admin/orders` untuk order list dan update status/payment.
- `/admin/inventory` untuk inventory adjustment dan inventory movements.

Gunakan route name `inventory` untuk memperbaiki typo user `inverory`.

### Admin Shared UI / State

Refactor admin UI dengan pendekatan minimal:

- Pertahankan localStorage token existing `admin-token`.
- Login admin tetap tersedia saat user belum authenticated.
- Sidebar admin link berubah dari anchor section ke route links:
  - `/admin`
  - `/admin/products`
  - `/admin/orders`
  - `/admin/inventory`
- Tiap halaman admin tetap memakai API-level RBAC existing melalui API client calls.
- Jika API mengembalikan Unauthorized/Forbidden, hapus token dan tampilkan login/unauthorized state seperti behavior existing.
- Hindari duplikasi handler dan layout berlebihan dengan shared component/helper bila tetap minimal dan jelas.

### Styling

Update `app/globals.css` untuk:

- Customer marketplace shell dengan left customer/cart summary card.
- Product grid customer yang makin selaras dengan homepage.
- Admin multi-page sidebar route navigation.
- Admin overview cards dan page-specific panels.
- Responsive behavior untuk mobile:
  - Customer left card turun di atas/bawah katalog.
  - Admin sidebar menjadi block/non-sticky.
  - Product grid dan table tetap usable.

### Documentation

Setelah implementasi:

- Buat atau update implementation note di `.opencode/docs/implement/`.
- Update task checklist bila task file terkait dibuat.
- Evaluasi `AGENTS.md` karena UI Routes berubah dengan penambahan admin routes baru.
- Update `AGENTS.md` jika perubahan route admin multi-page perlu didokumentasikan.

## Files Expected To Change

- `app/customer/page.tsx`
- `app/admin/page.tsx`
- `app/admin/products/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/inventory/page.tsx`
- Optional shared admin/customer UI files if needed and minimal.
- `app/globals.css`
- `.opencode/docs/implement/<implementation-note>.md`
- `AGENTS.md` if UI Routes documentation needs updating.

## Non-Goals

- Tidak mengubah endpoint API.
- Tidak mengubah auth/RBAC backend behavior.
- Tidak mengubah Prisma schema, SQL, migration, seed, service, repository, atau business logic backend.
- Tidak menambah dependency UI baru.
- Tidak membuat clone pixel-perfect homepage marketplace atau SB Admin; ikuti arah visual yang sudah dipakai di redesign sebelumnya.

## Implementation Steps

1. Refactor customer logged-in layout di `app/customer/page.tsx` agar lebih menyerupai homepage marketplace dan menambahkan left customer/cart card.
2. Pisahkan admin overview dari feature pages, dengan `/admin` menjadi overview ringkas.
3. Tambahkan `/admin/products` untuk manajemen produk dengan state/handler product existing.
4. Tambahkan `/admin/orders` untuk manajemen order dengan state/handler order existing.
5. Tambahkan `/admin/inventory` untuk adjustment stok dan inventory movements dengan state/handler inventory existing.
6. Tambahkan shared admin layout/auth helper/component bila diperlukan untuk menjaga perubahan tetap maintainable.
7. Update `app/globals.css` untuk customer marketplace shell dan admin route pages.
8. Buat/update implementation note.
9. Evaluasi dan update `AGENTS.md` jika perlu.

## Verification Plan

Jalankan minimal:

```bash
npm run lint
```

Jika memungkinkan, jalankan juga:

```bash
npm run build
```

Manual smoke test bila server/database tersedia:

- `/customer` sebelum login menampilkan login customer.
- Login customer berhasil dan logged-in page terlihat seperti marketplace homepage dengan card kiri.
- Search product, add/update cart, checkout, dan order history tetap berjalan.
- `/admin` sebelum login menampilkan login admin.
- Login admin berhasil dan overview tampil.
- `/admin/products` dapat load produk, search, paginate, create/edit/delete.
- `/admin/orders` dapat load order dan update status/payment.
- `/admin/inventory` dapat load movements dan membuat adjustment.
- Logout admin/customer membersihkan session UI.
- Wrong-role login tetap ditolak untuk admin/customer dashboard.

## Risks And Follow-Up

- Admin state yang sebelumnya satu file besar perlu dipisah hati-hati agar behavior login/token/error tetap konsisten.
- Multi-page admin meningkatkan kebutuhan shared UI; terlalu banyak duplikasi akan menyulitkan maintenance.
- Product card masih menggunakan visual initials/block karena model produk belum memiliki image field.
- Manual browser smoke test penting karena lint/build tidak memvalidasi runtime auth, API data, dan responsive UI.
