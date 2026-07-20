# Plan: Customer Registration Page

## Tujuan

Menambahkan halaman register customer di UI agar customer baru bisa membuat akun dari browser. Registrasi sukses langsung menyimpan token customer dan membawa user ke dashboard customer.

## Scope

- Tambah page baru `/register` untuk form registrasi customer.
- Tambah button/link register dari homepage dan login customer.
- Reuse endpoint existing `POST /api/auth/register`.
- Reuse localStorage key customer existing agar flow setelah register sama dengan login customer.

## User Flow

1. User membuka homepage `/` atau halaman login customer `/customer`.
2. User klik button/link register.
3. User mengisi `name`, `email`, dan `password` di `/register`.
4. UI submit ke `POST /api/auth/register`.
5. Jika sukses, UI menyimpan token dan user metadata ke localStorage.
6. User diarahkan ke `/customer` dan dashboard customer terbuka otomatis.
7. Jika gagal, UI menampilkan error API seperti `Email already registered` atau `Validation error`.

## Perubahan File

- `lib/customer-api.ts`
  - Tambah function `registerCustomer(email, password, name)`.
  - Function memanggil `POST /api/auth/register`.
  - Return type menggunakan `CustomerAuthResponse` existing.

- `app/register/page.tsx`
  - Tambah client page register.
  - Form fields: `name`, `email`, `password`.
  - Submit memakai `registerCustomer()`.
  - Validasi HTML dasar lewat input type/required/minLength.
  - Saat sukses, simpan:
    - `customer-token`
    - `customer-role`
    - `customer-email`
  - Redirect ke `/customer`.
  - Saat gagal, tampilkan error message.
  - Sediakan link kembali ke `/customer` untuk login existing account dan `/` untuk homepage.

- `app/page.tsx`
  - Tambah link/button `Register` ke `/register` di nav atau hero action.
  - Jaga tampilan homepage tetap konsisten dengan style existing.

- `app/customer/page.tsx`
  - Tambah link/button `Daftar customer baru` pada kartu login customer.
  - Link mengarah ke `/register`.

- `app/globals.css`
  - Reuse class existing `auth-card`, `auth-visual`, `auth-form-card`, `form-grid`, `primary-button`, dan `ghost-button` sebanyak mungkin.
  - Tambah CSS minimal jika dibutuhkan untuk row action/link di form auth.

- `AGENTS.md`
  - Tambah `/register` ke bagian UI Routes setelah implementasi.

- `.opencode/docs/implement/`
  - Tambah catatan implementasi setelah perubahan selesai.

## Detail Desain UI

- Page `/register` memakai layout auth card yang sama dengan customer login agar konsisten.
- Copy visual menekankan registrasi customer baru, persistent cart, dan checkout.
- Button utama: `Create account` atau `Daftar customer`.
- Link sekunder: `Sudah punya akun? Login customer`.
- Role tidak pernah dipilih di UI karena endpoint selalu membuat `CUSTOMER`.

## State Dan Error Handling

- State form: `name`, `email`, `password`.
- State UI: `loading`, `error`.
- Disable submit saat loading.
- Error dari API ditampilkan sebagai text aman, bukan HTML.
- Setelah register sukses, cek `result.user.role === 'CUSTOMER'` sebelum menyimpan session. Jika bukan customer, tampilkan error defensif.

## Verifikasi

- Jalankan `npm run lint`.
- Jalankan `npm run build` karena menambah Next.js page baru.
- Manual smoke test:
  - Buka `/` dan pastikan button/link register terlihat.
  - Klik register dan pastikan masuk ke `/register`.
  - Submit data customer baru dan pastikan redirect ke `/customer`.
  - Pastikan dashboard customer terbuka memakai token hasil register.
  - Coba email duplikat dan pastikan error tampil.
  - Buka `/customer` tanpa token dan pastikan button/link register terlihat di login card.

## Risiko Dan Follow-Up

- Duplicate email message berasal dari API dan dapat mengindikasikan email sudah terdaftar; behavior ini mengikuti endpoint API yang sudah ada.
- Password strength hanya mengikuti validasi backend saat ini (`min(6)`, `max(128)`). UI tidak menambah policy baru agar tidak drift dari API.
