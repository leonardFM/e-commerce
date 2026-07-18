import type { PaymentMethod, SimulatedPaymentStatus } from '@/modules/payments/payment.types'

export type CheckoutInput = {
  paymentMethod: PaymentMethod
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingPostalCode: string
  shippingCost: number
  simulatePaymentStatus?: SimulatedPaymentStatus
}
