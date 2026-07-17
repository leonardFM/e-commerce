import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(500).nullable().optional(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
})

export const updateProductSchema = createProductSchema.partial()

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
})
