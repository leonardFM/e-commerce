# Implementasi: Registrasi Customer Baru

## Ringkasan

- Menambahkan endpoint `POST /api/auth/register` untuk registrasi customer baru.
- Registrasi sukses langsung mengembalikan JWT dan data user dengan role `CUSTOMER`.
- Email dinormalisasi lowercase, password di-hash, dan role selalu dipaksa dari server.
- Email duplikat ditangani sebagai HTTP `409`, termasuk konflik unique constraint Prisma `P2002`.

## File Diubah

- `app/api/auth/register/route.ts`
- `modules/auth/auth.schema.ts`
- `modules/auth/auth.types.ts`
- `modules/auth/auth.repository.ts`
- `modules/auth/auth.service.ts`
- `tests/integration/auth.test.ts`
- `AGENTS.md`
- `.opencode/docs/task/customer-registration.md`

## Verifikasi Yang Direncanakan

- `npm run lint` — berhasil dengan 0 error dan 3 warning existing dari file `coverage/*`.
- `npm run test -- tests/integration/auth.test.ts` — berhasil, 11 tests passed.

## Manual Test Belum Dijalankan

- Manual HTTP `POST /api/auth/register` untuk sukses `201`, duplicate email `409`, invalid body `400`, dan body role admin tetap menghasilkan `CUSTOMER`.
- Manual protected endpoint check via HTTP client belum dijalankan, tetapi integration test sudah memverifikasi token hasil registrasi dapat dipakai ke `GET /api/cart`.

## Risiko Dan Follow-Up

- Endpoint registrasi publik belum memiliki rate limit khusus. Dapat ditambahkan bila diperlukan untuk mitigasi abuse.
