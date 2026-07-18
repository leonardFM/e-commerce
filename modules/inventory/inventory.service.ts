import { invalidateProductCaches } from '@/modules/products/product.cache'
import { createInventoryAdjustment, listInventoryMovements } from './inventory.repository'
import type { InventoryAdjustmentInput, ListInventoryMovementsQuery } from './inventory.types'

export async function listInventoryMovementsService(query: ListInventoryMovementsQuery) {
  return listInventoryMovements(query)
}

export async function createInventoryAdjustmentService(userId: number, input: InventoryAdjustmentInput) {
  const movement = await createInventoryAdjustment(userId, input)
  await invalidateProductCaches(input.productId)
  return movement
}
