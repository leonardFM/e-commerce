## Ringkasan

- Memperbaiki admin dashboard agar user dengan role `CUSTOMER` tidak dianggap sebagai sesi admin hanya karena memiliki JWT valid.
- Menambahkan role ke tipe response login di client admin.
- Menghapus token lokal jika request dashboard menerima `Unauthorized` atau `Forbidden`.

## File Diubah

- `app/admin/page.tsx`
- `lib/admin-api.ts`

## Verifikasi

- `npm run lint`

## Manual Test Belum Dijalankan

- Login dashboard dengan `customer@solutech.test` harus menampilkan error `Only admin users can access this dashboard` dan tidak membuka dashboard.
- Login dashboard dengan `admin@solutech.test` tetap membuka dashboard.

## Risiko / Follow-up

- Backend API mutasi produk sudah tetap menjadi enforcement utama lewat `requireRole(request, 'ADMIN')`.
- Jika dashboard admin bertambah endpoint baru, endpoint tersebut tetap harus memakai role guard di backend.
