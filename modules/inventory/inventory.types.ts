export type InventoryMovementType = 'ORDER_CHECKOUT' | 'ADMIN_ADJUSTMENT'

export type ListInventoryMovementsQuery = {
  page: number
  limit: number
  productId?: number
  type?: InventoryMovementType
}

export type InventoryAdjustmentInput = {
  productId: number
  quantityChange: number
  note?: string
}

export type InventoryMovementRecord = {
  id: number
  productId: number
  productName: string
  userId: number | null
  orderId: number | null
  type: InventoryMovementType
  quantityChange: number
  stockBefore: number
  stockAfter: number
  note: string | null
  createdAt: Date
}

export type InventoryMovementListResult = {
  items: InventoryMovementRecord[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
