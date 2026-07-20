/*
  Warnings:

  - You are about to alter the column `total` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `shippingCost` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `subtotal` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `unitPrice` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.

*/
-- DropIndex
DROP INDEX "CartItem_productId_idx";

-- DropIndex
DROP INDEX "InventoryMovement_orderId_idx";

-- DropIndex
DROP INDEX "InventoryMovement_productId_idx";

-- DropIndex
DROP INDEX "InventoryMovement_type_idx";

-- DropIndex
DROP INDEX "OrderItem_orderId_idx";

-- DropIndex
DROP INDEX "OrderItem_productId_idx";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "paymentMethod" DROP DEFAULT,
ALTER COLUMN "paymentReference" DROP DEFAULT,
ALTER COLUMN "shippingName" DROP DEFAULT,
ALTER COLUMN "shippingPhone" DROP DEFAULT,
ALTER COLUMN "shippingAddress" DROP DEFAULT,
ALTER COLUMN "shippingCity" DROP DEFAULT,
ALTER COLUMN "shippingPostalCode" DROP DEFAULT,
ALTER COLUMN "shippingCost" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "subtotal" DROP DEFAULT,
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "productName" TEXT NOT NULL DEFAULT 'Unknown Product',
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_createdAt_idx" ON "InventoryMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_type_createdAt_idx" ON "InventoryMovement"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Product_deletedAt_createdAt_idx" ON "Product"("deletedAt", "createdAt");
