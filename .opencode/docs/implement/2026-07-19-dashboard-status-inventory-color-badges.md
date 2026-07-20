# Dashboard Status And Inventory Color Badges Implementation

## Summary

- Menambahkan badge warna untuk status order dan payment di dashboard admin.
- Menambahkan badge sumber inventory movement untuk membedakan checkout customer dan admin adjustment.
- Menambahkan badge arah perubahan quantity inventory agar stok bertambah/berkurang lebih jelas.
- Status `PENDING` memakai warna kuning/oranye sesuai keputusan plan.

## Changed Files

- `app/admin/admin-client.tsx`
- `app/globals.css`

## Verification

- `npm run lint`: passed dengan 3 warning existing dari file `coverage/*` terkait unused eslint-disable directive.
- `npm run build`: passed.

## Manual Tests Not Run

- Belum smoke test `/admin` untuk recent orders.
- Belum smoke test `/admin/orders` untuk badge status/payment di dekat dropdown.
- Belum smoke test `/admin/inventory` untuk badge checkout/admin adjustment dan quantity positif/negatif.

## API / Database / Prisma Impact

- Tidak ada perubahan API contract.
- Tidak ada perubahan database.
- Tidak ada perubahan Prisma schema.
- Tidak ada dependency baru.

## AGENTS.md Evaluation

- `AGENTS.md` tidak diubah karena perubahan hanya visual UI dan tidak menambah endpoint, command, environment variable, arsitektur, auth/security, database/Prisma setup, atau workflow verifikasi baru.

## Risks And Follow-Up

- Perlu validasi visual manual untuk memastikan kontras warna cukup pada dashboard admin.
- Jika status order/payment atau inventory movement baru ditambahkan di masa depan, helper mapping badge perlu diperbarui.
