import { PrismaClient } from '@prisma/client'

export const testPrisma = new PrismaClient()

function assertTestDatabase() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required for tests')
  if (!new URL(databaseUrl).pathname.toLowerCase().includes('test')) {
    throw new Error('Refusing to reset non-test database')
  }
}

export async function resetDatabase() {
  assertTestDatabase()
  await testPrisma.$executeRawUnsafe('TRUNCATE TABLE "InventoryMovement", "CartItem", "Cart", "OrderItem", "Order", "Product", "User" RESTART IDENTITY CASCADE')
}

export async function disconnectDatabase() {
  await testPrisma.$disconnect()
}
