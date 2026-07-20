# Dashboard Status And Inventory Color Badges Tasks

Source plan: `.opencode/docs/plan/dashboard-status-inventory-color-badges.md`

## UI Helpers And Rendering

- [x] Add a small order status badge class mapping helper in `app/admin/admin-client.tsx` for `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, and `COMPLETED`.
- [x] Add a small payment status badge class mapping helper in `app/admin/admin-client.tsx` for `PENDING` and `PAID`.
- [x] Add a small inventory movement type badge class mapping helper in `app/admin/admin-client.tsx` for `ORDER_CHECKOUT` and `ADMIN_ADJUSTMENT`.
- [x] Add a small inventory quantity direction badge class mapping helper in `app/admin/admin-client.tsx` for positive and negative `movement.quantityChange` values.
- [x] Update admin recent order rendering in `OrderList` so order status is always displayed as a colored badge.
- [x] Update `/admin/orders` UI in `app/admin/admin-client.tsx` so current order status and payment status badges appear near the related dropdowns.
- [x] Update `MovementList` in `app/admin/admin-client.tsx` to display movement source badges (`Checkout` or `Admin`) and quantity badges (`+n` or `-n`) with distinct colors.

## Styling

- [x] Add `.stock-pill.pending` style in `app/globals.css` using yellow/orange warning coloring.
- [x] Add `.stock-pill.paid` style in `app/globals.css` using green coloring.
- [x] Add `.stock-pill.processing` style in `app/globals.css` using blue coloring.
- [x] Add `.stock-pill.shipped` style in `app/globals.css` using purple or cyan coloring.
- [x] Add `.stock-pill.completed` style in `app/globals.css` using dark green coloring.
- [x] Add `.stock-pill.checkout` style in `app/globals.css` using blue/purple coloring.
- [x] Add `.stock-pill.admin-adjustment` style in `app/globals.css` using orange coloring.
- [x] Add `.stock-pill.positive` style in `app/globals.css` using green coloring.
- [x] Add `.stock-pill.negative` style in `app/globals.css` using soft red or orange-red coloring.
- [x] Check color contrast against the existing admin dashboard background.

## Documentation And Workflow

- [x] Confirm no API, database, Prisma schema, business logic, or dependency changes are introduced.
- [x] Evaluate whether `AGENTS.md` manual UI/API testing notes need updates for the new admin badge behavior, and update only if needed.
- [x] After implementation, create or update an implementation note in `.opencode/docs/implement/` with summary, changed files, verification, manual tests not run, and risks/follow-up.

## Verification

- [x] Run `npm run lint`.
- [x] Run `npm run build` if lint passes and time allows.
- [ ] Manual smoke test `/admin` and verify recent orders have colored badges.
- [ ] Manual smoke test `/admin/orders` and verify `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, and `COMPLETED` status/payment display is clear and color-distinct.
- [ ] Manual smoke test `/admin/inventory` and verify checkout movements and admin adjustments have different source colors and quantity direction colors.

## Implementation Status

- Automated verification completed on 2026-07-19.
- Manual smoke tests not run in this session because no dev server/browser verification was requested or available.
