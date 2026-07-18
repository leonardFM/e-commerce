import { AppError } from '@/lib/errors'
import { acquireRedisLock, releaseRedisLock } from '@/lib/lock'
import { invalidateProductCaches } from '@/modules/products/product.cache'
import { simulatePayment } from '@/modules/payments/payment.service'
import { checkoutCart, validateCheckoutCart } from './checkout.repository'
import type { CheckoutInput } from './checkout.types'

const CHECKOUT_LOCK_TTL_SECONDS = 30

export async function checkoutService(userId: number, input: CheckoutInput) {
  const lock = await acquireRedisLock(`checkout:lock:user:${userId}`, CHECKOUT_LOCK_TTL_SECONDS)
  if (lock === false) throw new AppError('Checkout is already being processed', 409)

  try {
    await validateCheckoutCart(userId)

    const payment = simulatePayment({
      paymentMethod: input.paymentMethod,
      simulatePaymentStatus: input.simulatePaymentStatus,
    })

    const order = await checkoutCart(userId, input, payment)
    await Promise.all(order.affectedProductIds.map((productId) => invalidateProductCaches(productId)))
    const { affectedProductIds: _affectedProductIds, ...orderRecord } = order

    return {
      order: orderRecord,
      payment: {
        paymentStatus: payment.paymentStatus,
        paymentReference: payment.paymentReference,
      },
    }
  } finally {
    await releaseRedisLock(lock)
  }
}
