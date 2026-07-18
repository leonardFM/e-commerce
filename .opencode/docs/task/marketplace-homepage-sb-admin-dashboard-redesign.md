# Marketplace Homepage And SB Admin Dashboard Redesign Tasks

Source plan: `.opencode/docs/plan/marketplace-homepage-sb-admin-dashboard-redesign.md`

## Homepage Marketplace Redesign

- [x] Redesign `app/page.tsx` as a bright marketplace homepage while preserving the existing server-side featured products fetch from the current service.
- [x] Add a top promo bar, marketplace-style header with logo, search-style bar, and links to customer/admin dashboards.
- [x] Add a retail promo hero banner with shopping CTA.
- [x] Add quick marketplace category sections and a benefit/service strip.
- [x] Update featured product grid cards with thumbnail block, stock badge, prominent price, and CTA.
- [x] Add bottom CTA section for admin/customer entry points.

## Admin Dashboard SB Admin Redesign

- [x] Redesign `app/admin/page.tsx` visual structure to follow an SB Admin-style dashboard while preserving all existing state, handlers, auth behavior, and API client calls.
- [x] Add dark blue sidebar with brand, navigation, session info, and logout.
- [x] Add white topbar with search and dashboard summary.
- [x] Restyle metric cards with accent borders and light shadows.
- [x] Restyle product table as an admin template table.
- [x] Place catalog editor, recent orders, and inventory audit into dashboard panels/cards.
- [x] Modernize the admin login screen without changing auth/RBAC behavior.

## Customer Dashboard Marketplace Redesign

- [x] Redesign `app/customer/page.tsx` as a bright marketplace-aligned customer dashboard while preserving cart, checkout, order history, auth behavior, and existing API calls.
- [x] Restyle product cards to match homepage ecommerce cards.
- [x] Add sticky cart/checkout panel resembling a marketplace checkout sidebar.
- [x] Restyle order history as clean cards/lists.
- [x] Modernize the customer login screen without changing auth/RBAC behavior.

## Global Styling And Metadata

- [x] Rewrite/clean up `app/globals.css` from dark glassmorphism toward a light ecommerce/admin theme.
- [x] Add or update classes for marketplace header, hero, categories, dashboard shell, sidebar, topbar, metric cards, table, form, cart, and orders.
- [x] Preserve existing CSS classes that are still used so TSX changes stay minimal and existing behavior remains intact.
- [x] Ensure responsive behavior for mobile header, product grids, sidebar, dashboard layout, and cart/checkout panel.
- [x] Evaluate `app/layout.tsx` and update metadata only if relevant to the new product/design positioning; do not change root layout behavior unless necessary.

## Documentation And Repository Guidance

- [x] After implementation, create or update an implementation note in `.opencode/docs/implement/` summarizing changes, files changed, verification run, manual tests not run, risks, and follow-up.
- [x] Evaluate whether `AGENTS.md` needs updates; likely no update is needed because the plan only changes UI/design, but document the decision in the implementation note.

## Verification

- [x] Run `npm run lint`.
- [x] If possible, run `npm run build`.
- [!] If server and database are available, manually smoke test homepage `/` on desktop and mobile. Blocker: dev server/browser manual smoke test was not run in this session.
- [!] If server and database are available, login as admin at `/admin` and verify sidebar, metrics, product table, editor, orders, inventory audit, and logout. Blocker: dev server/database/browser manual smoke test was not run in this session.
- [!] If server and database are available, login as customer at `/customer` and verify catalog, cart, checkout panel, and order history. Blocker: dev server/database/browser manual smoke test was not run in this session.
- [!] Verify RBAC UI still rejects wrong-role access for `/admin` and `/customer`. Blocker: manual browser login smoke test was not run in this session.

## Constraints / Non-Goals

- [x] Do not add new UI dependencies.
- [x] Do not change API endpoints, auth/RBAC behavior, Prisma schema, seed data, migrations, SQL, services, repositories, or business logic.
- [x] Do not attempt a pixel-perfect clone of ruparupa.com or SB Admin; follow only the visual direction described in the plan.
