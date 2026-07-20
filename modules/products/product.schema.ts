import { z } from 'zod'
import { sanitize } from '@/lib/sanitize'

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(120).transform(sanitize).pipe(z.string().min(1)),
  description: z.string().trim().max(500).nullable().optional().transform((v) => (v ? sanitize(v) : v)),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
})

export const updateProductSchema = createProductSchema.partial()

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).optional().transform((v) => (v ? sanitize(v) : v)),
})
