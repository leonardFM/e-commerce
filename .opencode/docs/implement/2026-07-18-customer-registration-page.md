# Implementasi: Customer Registration Page

## Ringkasan

- Menambahkan halaman `/register` untuk registrasi customer baru dari UI.
- Halaman register memanggil `POST /api/auth/register`, menyimpan token customer ke localStorage, lalu redirect ke `/customer`.
- Menambahkan link/button register di homepage dan kartu login customer.
- UI tidak menyediakan pilihan role; role tetap dipaksa oleh API sebagai `CUSTOMER`.

## File Diubah

- `app/register/page.tsx`
- `app/page.tsx`
- `app/customer/page.tsx`
- `app/globals.css`
- `lib/customer-api.ts`
- `AGENTS.md`
- `.opencode/docs/task/customer-registration-page.md`

## Verifikasi Yang Direncanakan

- `npm run lint` — berhasil dengan 0 error dan 3 warning existing dari file `coverage/*`.
- `npm run build` — berhasil; route `/register` terdeteksi sebagai static route.

## Manual Test Belum Dijalankan

- Buka `/` dan pastikan button/link register terlihat.
- Klik register dan pastikan masuk ke `/register`.
- Submit data customer baru dan pastikan redirect ke `/customer` — blocked karena belum ada sesi browser/dev server manual dalam eksekusi ini.
- Pastikan dashboard customer terbuka memakai token hasil register — blocked karena belum ada sesi browser/dev server manual dalam eksekusi ini.
- Coba email duplikat dan pastikan error tampil.
- Buka `/customer` tanpa token dan pastikan button/link register terlihat di login card.

## Risiko Dan Follow-Up

- Duplicate email message tetap mengikuti kontrak API existing.
- Password policy UI sengaja mengikuti batas backend agar tidak drift.
