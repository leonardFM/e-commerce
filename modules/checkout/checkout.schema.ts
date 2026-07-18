import { z } from 'zod'

export const checkoutSchema = z.object({
  paymentMethod: z.enum(['BANK_TRANSFER', 'EWALLET', 'COD']),
  shippingName: z.string().trim().min(1).max(120),
  shippingPhone: z.string().trim().min(5).max(30),
  shippingAddress: z.string().trim().min(1).max(500),
  shippingCity: z.string().trim().min(1).max(120),
  shippingPostalCode: z.string().trim().min(1).max(20),
  shippingCost: z.number().nonnegative().default(0),
  simulatePaymentStatus: z.enum(['PAID', 'PENDING', 'FAILED']).optional(),
})
