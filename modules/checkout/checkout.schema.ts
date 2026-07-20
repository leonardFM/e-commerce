import { z } from 'zod'
import { sanitize } from '@/lib/sanitize'

export const checkoutSchema = z.object({
  paymentMethod: z.enum(['BANK_TRANSFER', 'EWALLET', 'COD']),
  shippingName: z.string().trim().min(1).max(120).transform(sanitize),
  shippingPhone: z.string().trim().min(5).max(30).transform(sanitize),
  shippingAddress: z.string().trim().min(1).max(500).transform(sanitize),
  shippingCity: z.string().trim().min(1).max(120).transform(sanitize),
  shippingPostalCode: z.string().trim().min(1).max(20).transform(sanitize),
  shippingCost: z.number().nonnegative().default(0),
  simulatePaymentStatus: z.enum(['PAID', 'PENDING', 'FAILED']).optional(),
})
