import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { elapsedMs, startTimer } from '@/lib/performance'
import { acquireRedisLock, releaseRedisLock } from '@/lib/lock'
import { invalidateProductCaches } from '@/modules/products/product.cache'
import { simulatePayment } from '@/modules/payments/payment.service'
import { checkoutCart, validateCheckoutCart } from './checkout.repository'
import type { CheckoutInput } from './checkout.types'

const CHECKOUT_LOCK_TTL_SECONDS = 30

export async function checkoutService(userId: number, input: CheckoutInput) {
  const start = startTimer()
  let paymentFailureLogged = false
  logger.info({ userId, paymentMethod: input.paymentMethod }, 'checkout_started')
  const lock = await acquireRedisLock(`checkout:lock:user:${userId}`, CHECKOUT_LOCK_TTL_SECONDS)
  if (lock === false) {
    logger.warn({ userId }, 'checkout_lock_conflict')
    throw new AppError('Checkout is already being processed', 409)
  }

  try {
    await validateCheckoutCart(userId)

    let payment
    try {
      payment = simulatePayment({
        paymentMethod: input.paymentMethod,
        simulatePaymentStatus: input.simulatePaymentStatus,
      })
    } catch (error) {
      paymentFailureLogged = true
      logger.warn({ err: error, userId, paymentMethod: input.paymentMethod, durationMs: elapsedMs(start) }, 'checkout_payment_failed')
      throw error
    }

    const order = await checkoutCart(userId, input, payment)
    logger.info({ userId, orderId: order.id, total: order.total, paymentStatus: payment.paymentStatus }, 'checkout_order_created')
    await Promise.all(order.affectedProductIds.map((productId) => invalidateProductCaches(productId)))
    const { affectedProductIds: _affectedProductIds, ...orderRecord } = order

    logger.info({ userId, orderId: order.id, durationMs: elapsedMs(start) }, 'checkout_completed')

    return {
      order: orderRecord,
      payment: {
        paymentStatus: payment.paymentStatus,
        paymentReference: payment.paymentReference,
      },
    }
  } catch (error) {
    if (!paymentFailureLogged) logger.warn({ err: error, userId, paymentMethod: input.paymentMethod, durationMs: elapsedMs(start) }, 'checkout_failed')
    throw error
  } finally {
    await releaseRedisLock(lock)
  }
}
