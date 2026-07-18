import { simulatePayment } from '@/modules/payments/payment.service'
import { checkoutCart, validateCheckoutCart } from './checkout.repository'
import type { CheckoutInput } from './checkout.types'

export async function checkoutService(userId: number, input: CheckoutInput) {
  await validateCheckoutCart(userId)

  const payment = simulatePayment({
    paymentMethod: input.paymentMethod,
    simulatePaymentStatus: input.simulatePaymentStatus,
  })

  const order = await checkoutCart(userId, input, payment)

  return {
    order,
    payment: {
      paymentStatus: payment.paymentStatus,
      paymentReference: payment.paymentReference,
    },
  }
}
