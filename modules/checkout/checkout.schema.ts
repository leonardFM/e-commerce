import { z } from 'zod'

export const checkoutSchema = z.object({
  paymentMethod: z.enum(['BANK_TRANSFER', 'EWALLET', 'COD']),
  shippingName: z.string().min(1),
  shippingPhone: z.string().min(5),
  shippingAddress: z.string().min(1),
  shippingCity: z.string().min(1),
  shippingPostalCode: z.string().min(1),
  shippingCost: z.number().nonnegative().default(0),
  simulatePaymentStatus: z.enum(['PAID', 'PENDING', 'FAILED']).optional(),
})
