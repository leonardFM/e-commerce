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

ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS status "OrderStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'EWALLET',
ADD COLUMN IF NOT EXISTS "paymentReference" TEXT NOT NULL DEFAULT 'LEGACY',
ADD COLUMN IF NOT EXISTS "shippingName" TEXT NOT NULL DEFAULT 'Legacy checkout',
ADD COLUMN IF NOT EXISTS "shippingPhone" TEXT NOT NULL DEFAULT '-',
ADD COLUMN IF NOT EXISTS "shippingAddress" TEXT NOT NULL DEFAULT '-',
ADD COLUMN IF NOT EXISTS "shippingCity" TEXT NOT NULL DEFAULT '-',
ADD COLUMN IF NOT EXISTS "shippingPostalCode" TEXT NOT NULL DEFAULT '-',
ADD COLUMN IF NOT EXISTS "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "Order" SET subtotal = total WHERE subtotal = 0;

CREATE TABLE IF NOT EXISTS "Cart" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CartItem" (
  id SERIAL PRIMARY KEY,
  "cartId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CartItem_cartId_productId_key" UNIQUE ("cartId", "productId"),
  CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "InventoryMovement" (
  id SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL,
  "userId" INTEGER,
  "orderId" INTEGER,
  type "InventoryMovementType" NOT NULL,
  "quantityChange" INTEGER NOT NULL,
  "stockBefore" INTEGER NOT NULL,
  "stockAfter" INTEGER NOT NULL,
  note TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "InventoryMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX IF NOT EXISTS "CartItem_productId_idx" ON "CartItem"("productId");
CREATE INDEX IF NOT EXISTS "InventoryMovement_productId_idx" ON "InventoryMovement"("productId");
CREATE INDEX IF NOT EXISTS "InventoryMovement_type_idx" ON "InventoryMovement"(type);
CREATE INDEX IF NOT EXISTS "InventoryMovement_orderId_idx" ON "InventoryMovement"("orderId");
