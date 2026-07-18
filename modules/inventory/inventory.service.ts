import { createInventoryAdjustment, listInventoryMovements } from './inventory.repository'
import type { InventoryAdjustmentInput, ListInventoryMovementsQuery } from './inventory.types'

export async function listInventoryMovementsService(query: ListInventoryMovementsQuery) {
  return listInventoryMovements(query)
}

export async function createInventoryAdjustmentService(userId: number, input: InventoryAdjustmentInput) {
  return createInventoryAdjustment(userId, input)
}
