import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { elapsedMs, startTimer } from '@/lib/performance'
import { findOrderById, findOrderByUser, findOrdersByUser, listOrdersForAdmin, updateOrderPayment, updateOrderStatus } from './order.repository'
import type { ListOrdersQuery, OrderStatus, PaymentStatus } from './order.types'

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAID', 'PROCESSING'],
  PAID: ['PROCESSING'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['COMPLETED'],
  COMPLETED: [],
}

function validateStatusTransition(current: OrderStatus, next: OrderStatus): void {
  const allowed = VALID_TRANSITIONS[current]
  if (!allowed?.includes(next)) {
    throw new AppError(`Cannot transition from ${current} to ${next}`, 409)
  }
}

export async function listOrdersService(userId: number) {
  return findOrdersByUser(userId)
}

export async function getOrderService(userId: number, id: number) {
  const order = await findOrderByUser(id, userId)
  if (!order) throw new AppError('Order not found', 404)
  return order
}

export async function listAdminOrdersService(query: ListOrdersQuery) {
  return listOrdersForAdmin(query)
}

export async function updateOrderStatusService(id: number, status: OrderStatus) {
  const start = startTimer()
  const order = await findOrderById(id)
  if (!order) throw new AppError('Order not found', 404)
  validateStatusTransition(order.status, status)
  const updated = await updateOrderStatus(id, status)
  logger.info({ orderId: id, status, durationMs: elapsedMs(start) }, 'order_status_updated')
  return updated
}

export async function updateOrderPaymentService(id: number, paymentStatus: PaymentStatus) {
  const start = startTimer()
  const order = await findOrderById(id)
  if (!order) throw new AppError('Order not found', 404)
  if (order.paymentStatus === 'PAID' && paymentStatus === 'PENDING') {
    logger.warn({ orderId: id, currentPaymentStatus: order.paymentStatus, requestedPaymentStatus: paymentStatus }, 'order_payment_regression_denied')
    throw new AppError('Cannot change payment from PAID to PENDING', 409)
  }
  if (order.status === 'COMPLETED' && paymentStatus !== order.paymentStatus) {
    logger.warn({ orderId: id, currentPaymentStatus: order.paymentStatus, requestedPaymentStatus: paymentStatus }, 'order_invalid_payment_transition')
    throw new AppError('Completed order payment cannot be changed', 409)
  }
  if (paymentStatus === 'PAID' && order.paymentStatus !== 'PAID') {
    validateStatusTransition(order.status, 'PAID')
  }
  const updated = await updateOrderPayment(id, paymentStatus)
  logger.info({ orderId: id, paymentStatus, durationMs: elapsedMs(start) }, 'order_payment_updated')
  return updated
}
