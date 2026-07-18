# Task: Automated API Integration Tests

Source plan: `.opencode/docs/plan/api-integration-test-plan.md`

## Phase 1: Test Setup

- [x] Add test dependencies from the plan: `vitest`; evaluate optional `supertest` for HTTP-level route testing and `@vitest/coverage-v8` for coverage.
- [x] Add npm scripts in `package.json`: `test`, `test:watch`, `test:integration`, and `test:coverage` if coverage dependency is added.
- [x] Create `vitest.config.ts` for this Next.js/TypeScript API test setup.
- [x] Create `tests/helpers/db.ts` with `resetDatabase()` using the cleanup order from the plan.
- [x] Create `tests/helpers/fixtures.ts` with `seedUsers()`, `seedProducts()`, and `createProductFixture()`.
- [x] Create `tests/helpers/api.ts` with `loginAsAdmin()`, `loginAsCustomer()`, and `authHeader(token)`.
- [x] Configure tests to use a separate PostgreSQL database such as `solutech_test`, with `DATABASE_URL` and `JWT_SECRET` set for test runs.
- [x] Document how to apply migrations to the test DB before running tests.
- [x] Verify `npm run test` connects to the test DB and can seed admin, customer, and product fixtures.

## Phase 2: Auth and RBAC Integration Tests

- [x] Create `tests/integration/auth.test.ts`.
- [x] Test `POST /api/auth/login` succeeds for seeded admin.
- [x] Test `POST /api/auth/login` succeeds for seeded customer.
- [x] Test login with wrong password fails.
- [x] Test protected endpoint without token returns `401`, using routes such as `GET /api/cart`.
- [x] Test customer access to admin endpoints returns `403`, including `GET /api/admin/orders` or `GET /api/inventory/movements`.
- [x] Test admin access to admin endpoint succeeds.
- [x] Test invalid token returns `401`.

## Phase 3: Product Integration Tests

- [x] Create `tests/integration/products.test.ts`.
- [x] Test `GET /api/products` list succeeds.
- [x] Test product search works.
- [x] Test product pagination works.
- [x] Test admin can create product through `POST /api/products`.
- [x] Test admin can update product through `PATCH /api/products/:id`.
- [x] Test admin can soft delete product through `DELETE /api/products/:id`.
- [x] Test soft-deleted products do not appear in active product list, preserving `deletedAt: null` behavior.
- [x] Test customer cannot create, update, or delete products.
- [x] Test negative price returns `400`.
- [x] Test negative stock returns `400`.

## Phase 4: Cart Persistence Integration Tests

- [x] Create `tests/integration/cart.test.ts`.
- [x] Test `GET /api/cart` creates or retrieves the authenticated user cart.
- [x] Test `POST /api/cart/items` adds item successfully.
- [x] Test adding the same product increments quantity.
- [x] Test fetching cart again keeps persisted items.
- [x] Test `PATCH /api/cart/items/:productId` updates quantity.
- [x] Test updating quantity to `0` removes the item.
- [x] Test `DELETE /api/cart/items/:productId` removes item.
- [x] Test `DELETE /api/cart` clears cart.
- [x] Test missing product returns `404`.
- [x] Test quantity above stock returns `409`.
- [x] Test cart data is user-scoped and user A does not see user B cart items.

## Phase 5: Checkout Integration Tests

- [x] Create `tests/integration/checkout.test.ts`.
- [x] Test successful `EWALLET` checkout returns `201`, sets `paymentStatus = PAID`, sets order status `PAID`, computes `subtotal + shippingCost = total`, creates matching order items, decrements stock, clears cart, and creates `ORDER_CHECKOUT` inventory movement with `stockBefore`, `stockAfter`, `quantityChange`, and `orderId`.
- [x] Test successful `COD` checkout sets `paymentStatus = PENDING`, order status `PENDING`, decrements stock, clears cart, and creates inventory movement.
- [x] Test checkout with `simulatePaymentStatus: FAILED` returns `402` and does not create order, decrement stock, clear cart, or create inventory movement.
- [x] Test insufficient stock returns `409` and does not create order, change stock, clear cart, or create inventory movement.
- [x] Test empty cart returns `400`.
- [x] Test missing shipping field returns `400`.
- [x] Test negative shipping cost returns `400`.
- [x] Test invalid payment method returns `400`.
- [x] Ensure checkout assertions preserve transaction safety for stock, totals, order items, inventory movements, and cart cleanup.

## Phase 6: Order Integration Tests

- [x] Create `tests/integration/orders.test.ts`.
- [x] Test customer can list own orders through `GET /api/orders`.
- [x] Test customer can view own order detail through `GET /api/orders/:id`.
- [x] Test customer cannot view another user's order and receives `404`.
- [x] Test order response includes status, payment, and shipping fields.
- [x] Test admin can list all orders through `GET /api/admin/orders`.
- [x] Test admin can update order status through `PATCH /api/admin/orders/:id/status`.
- [x] Test admin can update payment status through `PATCH /api/admin/orders/:id/payment`.
- [x] Test updating payment to `PAID` automatically sets status to `PAID` when previously `PENDING`.
- [x] Test completed order cannot regress.
- [x] Test customer cannot access admin order endpoints.

## Phase 7: Inventory Integration Tests

- [x] Create `tests/integration/inventory.test.ts`.
- [x] Test admin can list inventory movements through `GET /api/inventory/movements`.
- [x] Test inventory movement filter by `productId` works.
- [x] Test inventory movement filter by `type` works.
- [x] Test positive admin adjustment increases stock through `POST /api/inventory/adjustments`.
- [x] Test negative admin adjustment decreases stock.
- [x] Test negative adjustment above stock returns `409`.
- [x] Test failed adjustment does not create movement.
- [x] Test `quantityChange: 0` returns `400`.
- [x] Test customer cannot access inventory endpoints.
- [x] Test checkout creates movement type `ORDER_CHECKOUT`.
- [x] Test admin adjustment creates movement type `ADMIN_ADJUSTMENT`.

## Phase 8: Transaction and Concurrency Tests

- [ ] Create `tests/integration/checkout-concurrency.test.ts` after basic checkout tests are stable.
- [ ] Test two customers checking out the last stock unit concurrently results in exactly one successful checkout and one `409` failure.
- [ ] Assert final stock is `0`.
- [ ] Assert only one order is created.
- [ ] Assert only one checkout inventory movement is created.
- [ ] Mark or structure this test to reduce flakiness in uncontrolled environments.

## Phase 9: Unit Tests After Integration Stabilizes

- [ ] Add unit tests only after core integration flow is stable.
- [ ] Consider tests for payment simulation mapping.
- [ ] Consider tests for schema validation.
- [ ] Consider tests for status transition rules.
- [ ] Consider tests for parse id helper.
- [ ] Consider tests for money calculation if later extracted into a helper.

## MVP Slice

- [x] Implement Vitest and test DB helpers.
- [x] Test admin and customer login.
- [x] Test customer adds product to cart.
- [x] Test successful `EWALLET` checkout creates order, reduces stock, clears cart, and creates movement.
- [x] Test failed simulated payment creates no order, does not reduce stock, and keeps cart unchanged.
- [x] Test customer cannot access `/api/admin/orders`.

## Documentation and Repository Workflow

- [x] Update `.env.example` or test setup docs if a test database URL or test JWT secret workflow is introduced.
- [x] Update `AGENTS.md` because the plan adds/changes test commands, verification workflow, and test database setup.
- [x] Add implementation notes under `.opencode/docs/implement/` after implementing the test setup or test suites.

## Verification

- [x] Run `npm run test`.
- [x] Run `npm run test:integration`.
- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [ ] If Prisma schema or setup changes are made, run `npm run prisma:generate` and update related SQL/setup instructions.
- [x] Confirm automated tests use the test database only and never the development database.
