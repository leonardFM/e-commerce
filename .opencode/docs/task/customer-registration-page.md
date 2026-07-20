# Task: Customer Registration Page

Source plan: `/home/ubuntu/e-commerce-solutech/.opencode/docs/plan/customer-registration-page.md`

## Customer API Helper

- [x] Update `lib/customer-api.ts` dengan function `registerCustomer(email, password, name)`.
- [x] Pastikan `registerCustomer()` memanggil endpoint existing `POST /api/auth/register`.
- [x] Gunakan return type `CustomerAuthResponse` existing agar flow session sama dengan login customer.

## Register UI Route

- [x] Tambah client page baru di `app/register/page.tsx` untuk route `/register`.
- [x] Buat form registrasi dengan field `name`, `email`, dan `password`.
- [x] Terapkan validasi HTML dasar lewat input type, `required`, dan `minLength` sesuai plan.
- [x] Kelola state form `name`, `email`, `password` dan state UI `loading`, `error`.
- [x] Submit form memakai `registerCustomer()`.
- [x] Disable submit saat `loading`.
- [x] Saat register sukses, cek defensif `result.user.role === 'CUSTOMER'` sebelum menyimpan session.
- [x] Saat register sukses dan role customer valid, simpan `customer-token`, `customer-role`, dan `customer-email` ke localStorage key customer existing.
- [x] Redirect ke `/customer` setelah session customer tersimpan.
- [x] Saat register gagal, tampilkan error API sebagai text aman, bukan HTML.
- [x] Sediakan link kembali ke `/customer` untuk login existing account dan `/` untuk homepage.
- [x] Gunakan layout auth card yang konsisten dengan customer login.
- [x] Pastikan UI tidak menyediakan pilihan role karena endpoint selalu membuat `CUSTOMER`.

## Homepage And Customer Login Links

- [x] Update `app/page.tsx` untuk menambahkan link/button `Register` ke `/register` di nav atau hero action.
- [x] Jaga tampilan homepage tetap konsisten dengan style existing.
- [x] Update `app/customer/page.tsx` untuk menambahkan link/button `Daftar customer baru` pada kartu login customer.
- [x] Pastikan link/button dari login customer mengarah ke `/register`.

## Styling

- [x] Update `app/globals.css` hanya jika diperlukan untuk row action/link di form auth.
- [x] Reuse class existing `auth-card`, `auth-visual`, `auth-form-card`, `form-grid`, `primary-button`, dan `ghost-button` sebanyak mungkin.
- [x] Jaga tambahan CSS tetap minimal dan sesuai style existing.

## Documentation

- [x] Update `AGENTS.md` setelah implementasi dengan menambahkan UI route `/register` pada bagian UI Routes.
- [x] Buat catatan implementasi di `.opencode/docs/implement/` setelah perubahan selesai.

## Verification

- [x] Jalankan `npm run lint`.
- [x] Jalankan `npm run build` karena menambah Next.js page baru.
- [ ] Manual smoke test: buka `/` dan pastikan button/link register terlihat.
- [ ] Manual smoke test: klik register dan pastikan masuk ke `/register`.
- [!] Manual smoke test: submit data customer baru dan pastikan redirect ke `/customer`. Blocked: belum dijalankan karena tidak ada sesi browser/dev server manual dalam eksekusi ini.
- [!] Manual smoke test: pastikan dashboard customer terbuka memakai token hasil register. Blocked: belum dijalankan karena tidak ada sesi browser/dev server manual dalam eksekusi ini.
- [ ] Manual smoke test: coba email duplikat dan pastikan error tampil.
- [ ] Manual smoke test: buka `/customer` tanpa token dan pastikan button/link register terlihat di login card.
