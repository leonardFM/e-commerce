DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CUSTOMER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'EWALLET', 'COD');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InventoryMovementType" AS ENUM ('ORDER_CHECKOUT', 'ADMIN_ADJUSTMENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  name TEXT,
  role "UserRole" NOT NULL DEFAULT 'CUSTOMER',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Product" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  "deletedAt" TIMESTAMP NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Cart" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "CartItem" (
  id SERIAL PRIMARY KEY,
  "cartId" INTEGER NOT NULL REFERENCES "Cart"(id) ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES "Product"(id),
  quantity INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "CartItem_cartId_productId_key" UNIQUE ("cartId", "productId")
);

CREATE TABLE IF NOT EXISTS "Order" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  status "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paymentMethod" "PaymentMethod" NOT NULL,
  "paymentReference" TEXT NOT NULL,
  "shippingName" TEXT NOT NULL,
  "shippingPhone" TEXT NOT NULL,
  "shippingAddress" TEXT NOT NULL,
  "shippingCity" TEXT NOT NULL,
  "shippingPostalCode" TEXT NOT NULL,
  "shippingCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
  id SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES "Product"(id),
  "productName" TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "InventoryMovement" (
  id SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL REFERENCES "Product"(id),
  "userId" INTEGER NULL REFERENCES "User"(id) ON DELETE SET NULL,
  "orderId" INTEGER NULL REFERENCES "Order"(id) ON DELETE SET NULL,
  type "InventoryMovementType" NOT NULL,
  "quantityChange" INTEGER NOT NULL,
  "stockBefore" INTEGER NOT NULL,
  "stockAfter" INTEGER NOT NULL,
  note TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Check constraints
ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_check" CHECK (stock >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_price_check" CHECK (price >= 0);
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_quantity_check" CHECK (quantity > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_check" CHECK (quantity > 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingCost_check" CHECK ("shippingCost" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_subtotal_check" CHECK (subtotal >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_total_check" CHECK (total >= 0);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_product_active_list" ON "Product" ("deletedAt", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_order_user" ON "Order" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_order_created" ON "Order" ("createdAt");
CREATE INDEX IF NOT EXISTS "idx_inventory_product" ON "InventoryMovement" ("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_inventory_type" ON "InventoryMovement" (type, "createdAt");
