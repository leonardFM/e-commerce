import { z } from 'zod'

export const addCartItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
})

export function parseProductId(value: string) {
  const productId = Number(value)
  if (!Number.isInteger(productId) || productId <= 0) throw new Error('Invalid product id')
  return productId
}
