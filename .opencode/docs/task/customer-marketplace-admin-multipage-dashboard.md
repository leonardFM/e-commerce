# Customer Marketplace And Admin Multipage Dashboard Tasks

Source plan: `.opencode/docs/plan/customer-marketplace-admin-multipage-dashboard.md`

## Customer Marketplace Layout

- [x] Refactor `app/customer/page.tsx` logged-in UI to follow the homepage marketplace visual pattern: promo/header/search-style input, catalog section, and product grid.
- [x] Add a left customer/cart summary card in `app/customer/page.tsx` with session/customer label, total cart items, total cart amount, checkout shortcut, and logout action.
- [x] Keep cart/checkout controls available as a sticky left or lower-left panel while the catalog remains the main/right content.
- [x] Keep order history visible as a clean card/list below the customer product catalog.
- [x] Preserve existing customer login flow, role validation behavior, and API client calls for products, cart, orders, cart item mutations, and checkout.

## Admin Multipage Routes

- [x] Refactor `app/admin/page.tsx` into an admin overview/dashboard summary route at `/admin`.
- [x] Create `app/admin/products/page.tsx` for product table, search, pagination, create/edit/delete product behavior using existing API calls.
- [x] Create `app/admin/orders/page.tsx` for order list and status/payment updates using existing API calls.
- [x] Create `app/admin/inventory/page.tsx` for inventory adjustment and inventory movement list using existing API calls.
- [x] Use the route name `inventory` consistently; do not introduce the typo `inverory`.

## Admin Shared UI And Auth State

- [x] Preserve existing `admin-token` localStorage behavior.
- [x] Ensure each admin page shows the admin login state when unauthenticated.
- [x] Replace admin sidebar section anchors with route links to `/admin`, `/admin/products`, `/admin/orders`, and `/admin/inventory`.
- [x] Preserve API-level RBAC behavior through existing protected API calls; do not change backend auth/RBAC.
- [x] If admin API calls return Unauthorized/Forbidden, clear the token and show the existing login/unauthorized state behavior.
- [x] Add minimal shared admin layout/auth/helper components only if needed to avoid excessive duplication.

## Styling

- [x] Update `app/globals.css` for the customer marketplace shell and left customer/cart summary card.
- [x] Update `app/globals.css` so the customer product grid aligns more closely with the homepage marketplace style.
- [x] Update `app/globals.css` for admin multipage sidebar route navigation, overview cards, and page-specific panels.
- [x] Add responsive behavior so the customer left card stacks above/below the catalog on mobile.
- [x] Add responsive behavior so the admin sidebar becomes block/non-sticky on mobile and product grids/tables remain usable.

## Boundaries And Documentation

- [x] Do not change API routes, Prisma schema, SQL/migrations, seed data, backend services, repositories, or backend business logic.
- [x] Do not add new UI dependencies.
- [x] Create or update an implementation note in `.opencode/docs/implement/` after implementation with summary, changed files, verification, manual tests not run, and risks/follow-up.
- [x] Evaluate `AGENTS.md` because admin UI routes are changing and new admin routes are being added.
- [x] Update `AGENTS.md` if the multipage admin UI routes need to be documented.

## Verification

- [x] Run `npm run lint`.
- [x] Run `npm run build` if possible.
- [!] Manually smoke test `/customer` before login shows customer login. Blocker: browser/dev server manual smoke test was not run in this session.
- [!] Manually smoke test customer login, marketplace-style layout with left card, product search, add/update cart, checkout, order history, and logout. Blocker: browser/dev server/database manual smoke test was not run in this session.
- [!] Manually smoke test `/admin` before login shows admin login. Blocker: browser/dev server manual smoke test was not run in this session.
- [!] Manually smoke test admin login and `/admin` overview. Blocker: browser/dev server/database manual smoke test was not run in this session.
- [!] Manually smoke test `/admin/products` loads products and supports search, pagination, create/edit/delete. Blocker: browser/dev server/database manual smoke test was not run in this session.
- [!] Manually smoke test `/admin/orders` loads orders and supports status/payment updates. Blocker: browser/dev server/database manual smoke test was not run in this session.
- [!] Manually smoke test `/admin/inventory` loads movements and supports valid inventory adjustment. Blocker: browser/dev server/database manual smoke test was not run in this session.
- [!] Manually smoke test wrong-role login remains rejected for admin and customer dashboards. Blocker: browser/dev server/database manual smoke test was not run in this session.
