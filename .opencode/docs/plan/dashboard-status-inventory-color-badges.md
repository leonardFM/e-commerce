# Dashboard Status And Inventory Color Badges Plan

## Goal

Membuat status order, payment, dan inventory movement di dashboard admin lebih mudah dibaca dengan badge warna yang konsisten. Status `PENDING` harus memakai warna kuning/oranye agar terlihat sebagai warning tanpa terlalu agresif.

## Scope

- Update UI admin di `app/admin/admin-client.tsx`.
- Update style global di `app/globals.css`.
- Tidak mengubah API, database, Prisma schema, atau business logic.
- Tidak menambah dependency baru.

## Order Status Colors

- `PENDING`: kuning/oranye untuk menandakan perlu perhatian.
- `PAID`: hijau atau hijau-biru untuk menandakan sudah dibayar.
- `PROCESSING`: biru untuk menandakan sedang diproses.
- `SHIPPED`: ungu atau cyan untuk menandakan sedang dikirim.
- `COMPLETED`: hijau gelap untuk menandakan selesai.

## Payment Status Colors

- `PENDING`: kuning/oranye.
- `PAID`: hijau.

## Inventory Movement Colors

- `ORDER_CHECKOUT`: biru/ungu untuk menandakan stok berubah karena checkout customer.
- `ADMIN_ADJUSTMENT`: oranye untuk menandakan perubahan stok manual dari admin.
- `quantityChange > 0`: hijau untuk stok bertambah.
- `quantityChange < 0`: merah lembut atau oranye-merah untuk stok berkurang.

## Implementation Steps

1. Tambahkan helper kecil di `app/admin/admin-client.tsx` untuk mapping class badge berdasarkan `order.status`.
2. Tambahkan helper kecil untuk mapping class badge berdasarkan `order.paymentStatus`.
3. Tambahkan helper kecil untuk mapping class badge berdasarkan `movement.type`.
4. Tambahkan helper kecil untuk mapping class badge berdasarkan arah `movement.quantityChange`.
5. Update `OrderList` agar status order selalu dirender sebagai badge berwarna.
6. Pada halaman orders, tampilkan badge status/payment aktif di samping atau dekat dropdown agar nilai saat ini lebih jelas.
7. Update `MovementList` agar menampilkan badge sumber movement (`Checkout` atau `Admin`) dan badge quantity (`+n` atau `-n`) dengan warna berbeda.
8. Tambahkan variasi CSS untuk `.stock-pill` di `app/globals.css`:
   - `.stock-pill.pending`
   - `.stock-pill.paid`
   - `.stock-pill.processing`
   - `.stock-pill.shipped`
   - `.stock-pill.completed`
   - `.stock-pill.checkout`
   - `.stock-pill.admin-adjustment`
   - `.stock-pill.positive`
   - `.stock-pill.negative`

## Verification

- Jalankan `npm run lint`.
- Jalankan `npm run build` jika lint aman dan waktu memungkinkan.
- Manual smoke test admin UI:
  - Buka `/admin` dan cek recent orders memiliki badge warna.
  - Buka `/admin/orders` dan cek status `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, dan `COMPLETED` terlihat berbeda.
  - Buka `/admin/inventory` dan cek movement dari checkout dan admin adjustment memiliki warna berbeda.

## Risks And Follow-Up

- Perlu memastikan warna tetap memiliki kontras yang cukup di background dashboard saat ini.
- Jika nanti ada status order/payment baru, helper mapping perlu diperbarui agar tidak jatuh ke warna default yang membingungkan.
