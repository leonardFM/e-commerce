# Customer Marketplace And Admin Multipage Dashboard Implementation

## Source

- Task: `.opencode/docs/task/customer-marketplace-admin-multipage-dashboard.md`
- Plan: `.opencode/docs/plan/customer-marketplace-admin-multipage-dashboard.md`

## Summary

- Refactored customer logged-in dashboard to use a marketplace-style header/search/hero pattern aligned with homepage.
- Added a left customer/cart summary rail with session label, cart item count, cart total, checkout shortcut, and logout.
- Kept cart/checkout controls available in the left rail and order history below the catalog.
- Split admin dashboard into multipage routes:
  - `/admin` overview
  - `/admin/products`
  - `/admin/orders`
  - `/admin/inventory`
- Added shared `AdminClient` component to preserve existing admin token/login/API call behavior while avoiding large route duplication.
- Added localStorage role/email metadata checks for admin/customer token restore so wrong-role stale tokens are not used to render authenticated UI shells.
- Customer cart mutations and checkout now clear customer session on Unauthorized/Forbidden responses.
- Updated global CSS for customer left rail and admin route navigation active state.
- Updated `AGENTS.md` UI route/manual smoke test notes for the new admin pages.

## Files Changed

- `app/customer/page.tsx`
- `app/admin/admin-client.tsx`
- `app/admin/page.tsx`
- `app/admin/products/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/inventory/page.tsx`
- `app/globals.css`
- `AGENTS.md`
- `.opencode/docs/implement/2026-07-18-customer-marketplace-admin-multipage-dashboard.md`

## API Contract Impact

- No API route or response contract changes.
- Existing frontend API calls are preserved.
- Admin/customer UI still rejects wrong roles after login result validation and protected API calls still enforce RBAC.

## Database / Prisma Impact

- No Prisma schema, SQL, migration, seed, repository, service, or database changes.
- `npm run prisma:generate` is not required.

## Verification

- `npm run lint` passed with 0 errors and 3 existing warnings from generated coverage files:
  - `coverage/block-navigation.js`
  - `coverage/prettify.js`
  - `coverage/sorter.js`
- `npm run build` passed successfully and generated static routes for `/admin`, `/admin/products`, `/admin/orders`, `/admin/inventory`, and `/customer`.

## Manual Tests Not Run Yet

- `/customer` before/after login marketplace layout.
- Customer product search, add/update cart, checkout, order history, logout.
- `/admin` overview before/after login.
- `/admin/products` products CRUD/search/pagination.
- `/admin/orders` status/payment update.
- `/admin/inventory` adjustment/movement list.
- Wrong-role login rejection for admin/customer dashboards.

## Risks / Follow-Up

- Admin shared client centralizes multiple pages; browser smoke testing is important to ensure each route loads the intended data.
- Product cards still use generated initials because product images are not part of the current product API/model.
