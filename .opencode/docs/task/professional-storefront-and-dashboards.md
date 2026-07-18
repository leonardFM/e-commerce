# Professional Storefront And Dashboards Tasks

Source plan: `.opencode/docs/plan/professional-storefront-and-dashboards.md`

## Persiapan

- [x] Baca ulang source plan dan referensi implementasi terkait UI/admin/customer di `.opencode/docs/` jika tersedia.
- [x] Review struktur halaman existing terutama `app/page.tsx`, `app/admin/page.tsx`, `app/globals.css`, dan helper API existing seperti `lib/admin-api.ts`.

## Homepage Toko Online

- [x] Update `app/page.tsx` menjadi landing page e-commerce profesional.
- [x] Tambahkan navbar, hero promo, kategori/benefit, produk unggulan, trust badges, dan CTA.
- [x] Pertahankan pengambilan produk unggulan secara server-side dari Prisma.
- [x] Tampilkan card produk berisi nama, deskripsi, harga, stok, dan CTA ke dashboard customer.
- [x] Tambahkan link ke `/customer` dan `/admin` dengan prioritas visual yang sesuai.

## Dashboard Admin Profesional

- [x] Refactor `app/admin/page.tsx` agar tampil seperti admin console modern.
- [x] Pertahankan login admin dan guard role `ADMIN`.
- [x] Tambahkan metrik ringkasan dari produk yang sudah di-load: total produk, total stok, low stock, dan nilai inventori.
- [x] Rapikan sidebar, header, quick actions, product editor, product table, pagination, empty state, dan status alert.
- [x] Pastikan aksi create, update, dan delete product tetap memakai API existing.
- [x] Pastikan token invalid atau forbidden tetap menghapus sesi lokal.

## Dashboard Customer

- [x] Tambah halaman baru `app/customer/page.tsx`.
- [x] Buat login customer memakai endpoint `POST /api/auth/login`.
- [x] Tolak role selain `CUSTOMER` di UI customer dashboard.
- [x] Ambil katalog produk lewat `GET /api/products` memakai JWT customer.
- [x] Buat cart sederhana di client state: tambah item, kurangi quantity, hapus item, dan hitung total.
- [x] Checkout cart lewat `POST /api/orders`.
- [x] Tampilkan riwayat order lewat `GET /api/orders`.
- [x] Simpan token customer di `localStorage` dengan key terpisah seperti `customer-token`.

## Client API Helper Dan Types

- [x] Tambah `lib/customer-api.ts` jika dibutuhkan.
- [x] Jika helper dibuat, implement `loginCustomer`, `fetchCustomerProducts`, `createCustomerOrder`, dan `fetchCustomerOrders`.
- [x] Reuse pola response wrapper dari `lib/admin-api.ts`.
- [x] Tambahkan tipe data untuk product, order, order item, dan auth response customer sesuai kebutuhan UI.

## Styling

- [x] Update `app/globals.css` untuk visual profesional dan responsive.
- [x] Pertahankan bahasa visual gelap modern yang sudah ada agar konsisten.
- [x] Tambahkan style terkait storefront homepage, admin dashboard baru, customer dashboard, product grid, cart panel, order history, dan responsive layout mobile.
- [x] Hindari rewrite CSS besar yang tidak perlu; rapikan hanya class terkait halaman baru/perubahan.

## Keamanan Dan RBAC

- [x] Pastikan admin dashboard hanya menerima user dengan role `ADMIN`.
- [x] Pastikan customer dashboard hanya menerima user dengan role `CUSTOMER`.
- [x] Pastikan backend tetap menjadi enforcement utama: endpoint admin product mutation memakai `requireRole(request, 'ADMIN')`.
- [x] Pastikan order customer tetap memakai endpoint yang memanggil `requireUser(request)` dan user scoping via `user.userId`, bukan userId dari body request.
- [x] Pastikan product listing tetap menghormati soft delete dengan `deletedAt: null` pada query product aktif.
- [x] Pastikan order checkout tetap menjaga transaction safety untuk stok dan total.

## Dokumentasi Dan Workflow Repo

- [x] Evaluasi apakah `AGENTS.md` perlu diupdate karena perubahan menyentuh halaman/routes UI dan workflow manual testing.
- [x] Jika perlu, update `AGENTS.md` sesuai perubahan endpoint, command, environment variable, arsitektur, auth/security, database/Prisma, manual testing, atau workflow verifikasi.
- [x] Setelah implementasi selesai, buat atau update catatan implementasi di `.opencode/docs/implement/` dengan ringkasan perubahan, file yang diubah, verifikasi, manual test yang belum dijalankan, dan risiko/follow-up.

## Verifikasi

- [x] Jalankan `npm run lint`.
- [x] Jalankan `npm run build` jika memungkinkan karena perubahan menyentuh page/client component dan CSS global.
- [!] Manual test homepage tampil baik di desktop dan mobile. Blocker: belum ada dev server/browser session manual pada eksekusi ini.
- [!] Manual test login admin berhasil masuk `/admin`. Blocker: belum ada dev server/browser session manual pada eksekusi ini.
- [!] Manual test login customer ditolak di `/admin`. Blocker: belum ada dev server/browser session manual pada eksekusi ini.
- [!] Manual test login customer berhasil masuk `/customer`. Blocker: belum ada dev server/browser session manual pada eksekusi ini.
- [!] Manual test login admin ditolak di `/customer`. Blocker: belum ada dev server/browser session manual pada eksekusi ini.
- [!] Manual test customer bisa melihat katalog, menambah cart, checkout, dan melihat order history. Blocker: belum ada dev server/browser session manual pada eksekusi ini.
- [!] Manual test admin tetap bisa create, update, dan delete product. Blocker: belum ada dev server/browser session manual pada eksekusi ini.

## Risiko Dan Follow-up Dari Plan

- [x] Catat bahwa cart belum persisted karena schema belum punya model cart.
- [x] Catat bahwa katalog customer membutuhkan login karena `GET /api/products` saat ini protected.
- [x] Jika nanti ingin storefront publik tanpa login, evaluasi endpoint product public atau perubahan auth policy di plan terpisah.
- [x] Jika dashboard customer perlu alamat pengiriman, payment, atau status order, rencanakan perluasan schema dan API order di plan terpisah.
