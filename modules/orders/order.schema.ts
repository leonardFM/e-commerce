import { z } from 'zod'

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED']),
})

export const updateOrderPaymentSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'PAID']),
})
