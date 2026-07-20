# Implementasi: RBAC Client-Side Role Verification

## Ringkasan

Mengganti pengecekan role berbasis string localStorage dengan `jose.decodeJwt()` di client-side auth guard, dan menambah mutual exclusion cleanup antara sesi admin dan customer. Sehingga user yang login sebagai customer tidak bisa melihat dashboard admin, dan sebaliknya.

## File yang Diubah

| File | Perubahan |
|------|-----------|
| **`app/admin/admin-client.tsx`** | Import `decodeJwt`; mount useEffect decode `admin-token` → verifikasi `payload.role === 'ADMIN'`; handleLogin cleanup `customer-*` keys |
| **`app/customer/page.tsx`** | Import `decodeJwt`; mount useEffect decode `customer-token` → verifikasi `payload.role === 'CUSTOMER'`; handleLogin cleanup `admin-*` keys |
| **`app/register/page.tsx`** | handleRegister cleanup `admin-*` keys sebelum simpan customer credentials |

## Detail Implementasi

### Mount useEffect (kedua file)
Sebelum:
```typescript
// Cuma cek string localStorage 'admin-role' / 'customer-role'
if (savedToken && savedRole !== 'ADMIN') { cleanup }
```

Sesudah:
```typescript
// Decode JWT dan cek payload.role langsung
if (savedToken) {
  try {
    const payload = decodeJwt(savedToken)
    if (payload.role === 'ADMIN') { setToken } else { cleanup }
  } catch { cleanup }
}
```

### handleLogin / handleRegister
Menambah `localStorage.removeItem()` untuk keys role lain sebelum menyimpan credentials role baru.

## Verifikasi

- `npm run lint` — 0 error, 3 warnings (pre-existing)
- `npm run build` — Compiled successfully, TypeScript passed

## Manual Test yang Belum Dijalankan

1. Login admin → buka `/admin` → dashboard admin tampil
2. Buka `/customer` → customer login form (admin token diabaikan karena `payload.role !== 'CUSTOMER'`)
3. Login customer → buka `/customer` → dashboard customer tampil
4. Buka `/admin` → admin login form (customer token diabaikan karena `payload.role !== 'ADMIN'`)
