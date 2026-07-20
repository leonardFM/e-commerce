# RBAC Client-Side Role Verification Plan

## Goal

Mencegah user mengakses dashboard admin dan customer secara bersamaan dalam browser yang sama. Setiap halaman harus memverifikasi role dari payload JWT langsung, bukan dari string localStorage, dan login sebagai satu role harus menghapus sesi role lainnya.

## Root Cause

- Admin page (`admin-client.tsx`) ngecek role dari string `admin-role` di localStorage, bukan dari payload JWT
- Customer page (`customer/page.tsx`) ngecek role dari string `customer-role`, bukan dari payload JWT
- Tidak ada mutual exclusion: login sebagai admin tidak cleanup `customer-*` keys, dan sebaliknya
- Registrasi customer juga tidak cleanup `admin-*` keys

## Changes

### 1. `app/admin/admin-client.tsx`

**A. Mount useEffect (line 186-202)** — ganti string check dengan `decodeJwt`:
- Import `{ decodeJwt }` from `jose`
- Baca `admin-token` dari localStorage
- `decodeJwt(savedToken)` → verifikasi `payload.role === 'ADMIN'`
- Jika bukan ADMIN atau token invalid (catch): cleanup semua `admin-*` keys
- Jika valid: set token & email seperti biasa
- Hapus dependency pada `admin-role` string

**B. handleLogin (line 240-258)** — tambah cleanup `customer-*` keys:
- Setelah confirm role ADMIN dan sebelum simpan admin credentials:
- `localStorage.removeItem('customer-token')`
- `localStorage.removeItem('customer-role')`
- `localStorage.removeItem('customer-email')`

### 2. `app/customer/page.tsx`

**C. Mount useEffect (line 56-73)** — ganti string check dengan `decodeJwt`:
- Import `{ decodeJwt }` from `jose`
- Baca `customer-token` dari localStorage
- `decodeJwt(savedToken)` → verifikasi `payload.role === 'CUSTOMER'`
- Jika bukan CUSTOMER atau token invalid (catch): cleanup semua `customer-*` keys
- Jika valid: set token & email seperti biasa
- Hapus dependency pada `customer-role` string

**D. handleLogin (line 107-129)** — tambah cleanup `admin-*` keys:
- Setelah confirm role CUSTOMER dan sebelum simpan customer credentials:
- `localStorage.removeItem('admin-token')`
- `localStorage.removeItem('admin-role')`
- `localStorage.removeItem('admin-email')`

### 3. `app/register/page.tsx`

**E. handleRegister (line 17-37)** — tambah cleanup `admin-*` keys:
- Setelah confirm role CUSTOMER dan sebelum simpan customer credentials:
- `localStorage.removeItem('admin-token')`
- `localStorage.removeItem('admin-role')`
- `localStorage.removeItem('admin-email')`

## Tidak Diubah

- Server-side auth (`lib/auth.ts`, `lib/request.ts`, `lib/response.ts`) — sudah aman dengan `requireRole()`
- API client (`lib/admin-api.ts`, `lib/customer-api.ts`) — tidak ada perubahan
- Database, Prisma, endpoint
- UI rendering logic selain mount guard

## Risk

- `jose.decodeJwt()` hanya decode base64, tidak verifikasi signature → safe di client, payload bisa dimanipulasi. Tapi manipulasi hanya berguna untuk melihat shell dashboard (data tetap gagal load dari API karena server verify signature).
- Jika token format tidak valid, `decodeJwt()` throw → catch akan cleanup keys → user logout. Perilaku yang benar.

## Verification

- `npm run lint`
- `npm run build`
- Manual test:
  1. Login admin → buka `/admin` → ✅ dashboard admin tampil
  2. Buka `/customer` → ❌ customer login form (token customer tidak ada, admin token diabaikan karena payload.role !== 'CUSTOMER')
  3. Login customer → buka `/customer` → ✅ dashboard customer tampil
  4. Buka `/admin` → ❌ admin login form (token admin tidak ada, customer token diabaikan karena payload.role !== 'ADMIN')
