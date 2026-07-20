# Token Revocation — Redis Blacklist

## Goal

Implementasi token revocation via Redis blacklist sehingga token yang di-logout tidak bisa digunakan lagi.

## Perubahan

### `lib/auth.ts`
- Tambah `jti` (JWT ID — UUID v4) ke payload JWT saat sign
- Ekspor `getJwtId(token)` — extract JTI dari token
- Ekspor `getJwtExp(token)` — extract expiry dari token

### `lib/token-blacklist.ts` — file baru
- `addToBlacklist(token)` — extract JTI + remaining TTL, simpan di Redis key `token-blacklist:<jti>` dengan TTL otomatis
- `isBlacklisted(token)` — cek apakah JTI ada di Redis
- Fail-open jika Redis tidak tersedia

### `lib/request.ts`
- `requireUser()` — setelah verifikasi JWT, panggil `isBlacklisted(token)`
- Jika blacklisted → throw `401 Unauthorized`

### `app/api/auth/logout/route.ts`
- Extract token dari request (cookie/header)
- Panggil `addToBlacklist(token)` sebelum clear cookie

## Files Affected

| File | Change |
|------|--------|
| `lib/auth.ts` | Tambah JTI, `getJwtId`, `getJwtExp` |
| `lib/token-blacklist.ts` | File baru |
| `lib/request.ts` | Blacklist check di `requireUser` |
| `app/api/auth/logout/route.ts` | Blacklist token sebelum clear cookie |
| `AGENTS.md` | Update docs |

## Verification

- [x] `npm run lint` — 0 error
- [x] `npm run build` — build sukses
- [x] `npm run test` — 51/51 lulus
- [ ] Manual: login → logout → token lama tidak bisa dipakai
- [ ] Manual: Redis tidak tersedia → logout tidak crash (fail-open)
- [ ] Manual: Redis tidak tersedia → request tetap jalan (fail-open)
