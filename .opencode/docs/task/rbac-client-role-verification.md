# RBAC Client-Side Role Verification

Source plan: `.opencode/docs/plan/rbac-client-role-verification.md`

## Overview

Replace string-based localStorage role checks with JWT payload decoding (`jose.decodeJwt`) in client-side auth guards, and add mutual exclusion cleanup between admin and customer sessions.

## Tasks

### Phase 1: Admin Client — `app/admin/admin-client.tsx`

- [x] **A. Mount useEffect — replace string check with `decodeJwt`**
  - Import `{ decodeJwt }` from `jose`
  - Read `admin-token` from localStorage instead of `admin-role`
  - Call `decodeJwt(savedToken)` and verify `payload.role === 'ADMIN'`
  - On invalid token or wrong role (catch): cleanup all `admin-*` localStorage keys
  - On valid token: set token & email state as before
  - Remove `admin-role` from dependency array

- [x] **B. handleLogin — add customer-* cleanup**
  - After confirming role is `ADMIN` and before saving admin credentials:
    - `localStorage.removeItem('customer-token')`
    - `localStorage.removeItem('customer-role')`
    - `localStorage.removeItem('customer-email')`

### Phase 2: Customer Page — `app/customer/page.tsx`

- [x] **C. Mount useEffect — replace string check with `decodeJwt`**
  - Import `{ decodeJwt }` from `jose`
  - Read `customer-token` from localStorage instead of `customer-role`
  - Call `decodeJwt(savedToken)` and verify `payload.role === 'CUSTOMER'`
  - On invalid token or wrong role (catch): cleanup all `customer-*` localStorage keys
  - On valid token: set token & email state as before
  - Remove `customer-role` from dependency array

- [x] **D. handleLogin — add admin-* cleanup**
  - After confirming role is `CUSTOMER` and before saving customer credentials:
    - `localStorage.removeItem('admin-token')`
    - `localStorage.removeItem('admin-role')`
    - `localStorage.removeItem('admin-email')`

### Phase 3: Register Page — `app/register/page.tsx`

- [x] **E. handleRegister — add admin-* cleanup**
  - After confirming role is `CUSTOMER` and before saving customer credentials:
    - `localStorage.removeItem('admin-token')`
    - `localStorage.removeItem('admin-role')`
    - `localStorage.removeItem('admin-email')`

### Verification

- [x] Run `npm run lint` — 0 errors, 3 pre-existing warnings
- [x] Run `npm run build` — build succeeds, TypeScript passed
- [!] Manual test A: Login admin → open `/admin` → dashboard admin tampil
- [!] Manual test B: Open `/customer` → customer login form muncul (admin token diabaikan karena `payload.role !== 'CUSTOMER'`)
- [!] Manual test C: Login customer → open `/customer` → dashboard customer tampil
- [!] Manual test D: Open `/admin` → admin login form muncul (customer token diabaikan karena `payload.role !== 'ADMIN'`)
