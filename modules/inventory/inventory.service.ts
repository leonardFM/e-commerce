import { logger } from '@/lib/logger'
import { elapsedMs, startTimer } from '@/lib/performance'
import { invalidateProductCaches } from '@/modules/products/product.cache'
import { createInventoryAdjustment, listInventoryMovements } from './inventory.repository'
import type { InventoryAdjustmentInput, ListInventoryMovementsQuery } from './inventory.types'

export async function listInventoryMovementsService(query: ListInventoryMovementsQuery) {
  return listInventoryMovements(query)
}

export async function createInventoryAdjustmentService(userId: number, input: InventoryAdjustmentInput) {
  const start = startTimer()
  try {
    const movement = await createInventoryAdjustment(userId, input)
    await invalidateProductCaches(input.productId)
    logger.info({ userId, productId: input.productId, quantityChange: input.quantityChange, movementId: movement.id, durationMs: elapsedMs(start) }, 'inventory_adjustment_created')
    return movement
  } catch (error) {
    logger.warn({ err: error, userId, productId: input.productId, quantityChange: input.quantityChange, durationMs: elapsedMs(start) }, 'inventory_adjustment_failed')
    throw error
  }
}
