import { z } from 'zod'

export const listInventoryMovementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  productId: z.coerce.number().int().positive().optional(),
  type: z.enum(['ORDER_CHECKOUT', 'ADMIN_ADJUSTMENT']).optional(),
})

export const inventoryAdjustmentSchema = z.object({
  productId: z.number().int().positive(),
  quantityChange: z.number().int().refine((value) => value !== 0, 'Quantity change cannot be zero'),
  note: z.string().max(500).optional(),
})
