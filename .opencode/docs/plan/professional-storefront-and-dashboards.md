# Professional Storefront And Dashboards Plan

## Tujuan

- Mengubah homepage menjadi halaman toko online yang terlihat profesional dan umum digunakan pada e-commerce.
- Meningkatkan tampilan dashboard admin agar lebih modern, informatif, dan nyaman dipakai untuk manajemen produk.
- Menambahkan dashboard customer untuk melihat katalog produk, membuat cart sederhana, checkout order, dan melihat riwayat order.

## Scope

- Tidak mengubah database atau Prisma schema.
- Tidak menambah endpoint baru jika API yang ada sudah cukup.
- Memakai endpoint yang sudah tersedia: login, products, dan orders.
- Cart customer dibuat sebagai state client-side, bukan persisted cart di database.
- Role admin dan customer tetap dipisahkan di UI dan backend.

## Homepage Toko Online

- Update `app/page.tsx` menjadi landing page e-commerce.
- Tambahkan struktur umum toko online: navbar, hero promo, kategori/benefit, produk unggulan, trust badges, dan CTA.
- Tetap mengambil produk unggulan secara server-side dari Prisma.
- Tampilkan card produk dengan nama, deskripsi, harga, stok, dan CTA ke dashboard customer.
- Tambahkan link ke `/customer` dan `/admin` dengan prioritas visual yang sesuai.

## Dashboard Admin Profesional

- Refactor `app/admin/page.tsx` agar tampil seperti admin console modern.
- Pertahankan login admin dan guard role `ADMIN` yang sudah ada.
- Tambahkan metrik ringkasan dari produk yang sudah di-load: total produk, total stok, low stock, dan nilai inventori.
- Rapikan sidebar, header, quick actions, product editor, product table, pagination, empty state, dan status alert.
- Pastikan aksi create, update, dan delete product tetap memakai API existing.
- Pastikan token invalid atau forbidden tetap menghapus sesi lokal.

## Dashboard Customer

- Tambah halaman baru `app/customer/page.tsx`.
- Buat login customer memakai endpoint `POST /api/auth/login`.
- Tolak role selain `CUSTOMER` di UI customer dashboard.
- Ambil katalog produk lewat `GET /api/products` memakai JWT customer.
- Buat cart sederhana di client state: tambah item, kurangi quantity, hapus item, dan hitung total.
- Checkout cart lewat `POST /api/orders`.
- Tampilkan riwayat order lewat `GET /api/orders`.
- Simpan token customer di `localStorage` dengan key terpisah, misalnya `customer-token`.

## Client API Helper

- Tambah helper baru `lib/customer-api.ts` jika dibutuhkan.
- Helper customer mencakup:
  - `loginCustomer`
  - `fetchCustomerProducts`
  - `createCustomerOrder`
  - `fetchCustomerOrders`
- Reuse pola response wrapper dari `lib/admin-api.ts`.
- Tambahkan tipe data untuk product, order, order item, dan auth response customer.

## Styling

- Update `app/globals.css` untuk visual profesional dan responsive.
- Pertahankan bahasa visual gelap modern yang sudah ada agar konsisten.
- Tambahkan style untuk:
  - storefront homepage
  - admin dashboard baru
  - customer dashboard
  - product grid
  - cart panel
  - order history
  - responsive layout mobile
- Hindari rewrite CSS besar yang tidak perlu, tetapi rapikan class yang terkait halaman baru.

## Keamanan Dan RBAC

- Admin dashboard hanya menerima user dengan role `ADMIN`.
- Customer dashboard hanya menerima user dengan role `CUSTOMER`.
- Backend tetap menjadi enforcement utama:
  - endpoint admin product mutation memakai `requireRole(request, 'ADMIN')`.
  - endpoint customer order memakai `requireUser(request)` dan userId dari token.
- Jangan memakai userId dari body request untuk order customer.

## Verifikasi

- Jalankan `npm run lint` setelah implementasi.
- Jalankan `npm run build` jika memungkinkan karena perubahan menyentuh page/client component dan CSS global.
- Manual test yang perlu dilakukan:
  - Homepage tampil baik di desktop dan mobile.
  - Login admin berhasil masuk `/admin`.
  - Login customer ditolak di `/admin`.
  - Login customer berhasil masuk `/customer`.
  - Login admin ditolak di `/customer`.
  - Customer bisa melihat katalog, menambah cart, checkout, dan melihat order history.
  - Admin tetap bisa create, update, dan delete product.

## Risiko Dan Follow-up

- Cart belum persisted karena schema belum punya model cart.
- Katalog customer membutuhkan login karena `GET /api/products` saat ini protected.
- Jika nanti ingin storefront publik tanpa login, perlu evaluasi endpoint product public atau perubahan auth policy.
- Jika dashboard customer perlu alamat pengiriman, payment, atau status order, perlu perluasan schema dan API order.
