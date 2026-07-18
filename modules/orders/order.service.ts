import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { elapsedMs, startTimer } from '@/lib/performance'
import { invalidateProductCaches } from '@/modules/products/product.cache'
import { createOrder, findOrderById, findOrderByUser, findOrdersByUser, listOrdersForAdmin, updateOrderPayment, updateOrderStatus } from './order.repository'
import type { CreateOrderInput, ListOrdersQuery, OrderStatus, PaymentStatus } from './order.types'

export async function createOrderService(userId: number, input: CreateOrderInput) {
  const start = startTimer()
  try {
    const order = await createOrder(userId, input)
    await Promise.all(order.items.map((item) => invalidateProductCaches(item.productId)))
    logger.info({ userId, orderId: order.id, total: order.total, durationMs: elapsedMs(start) }, 'order_created')
    return order
  } catch (error) {
    logger.warn({ err: error, userId, durationMs: elapsedMs(start) }, 'order_create_failed')
    if (error instanceof AppError) throw error
    const message = error instanceof Error ? error.message : 'Failed to create order'
    if (message.includes('Insufficient stock')) throw new AppError(message, 409)
    throw new AppError(message, 400)
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
  if (order.status === 'COMPLETED' && status !== 'COMPLETED') {
    logger.warn({ orderId: id, currentStatus: order.status, requestedStatus: status }, 'order_invalid_status_transition')
    throw new AppError('Completed order status cannot be changed', 409)
  }
  const updated = await updateOrderStatus(id, status)
  logger.info({ orderId: id, status, durationMs: elapsedMs(start) }, 'order_status_updated')
  return updated
}

export async function updateOrderPaymentService(id: number, paymentStatus: PaymentStatus) {
  const start = startTimer()
  const order = await findOrderById(id)
  if (!order) throw new AppError('Order not found', 404)
  if (order.status === 'COMPLETED' && paymentStatus !== order.paymentStatus) {
    logger.warn({ orderId: id, currentPaymentStatus: order.paymentStatus, requestedPaymentStatus: paymentStatus }, 'order_invalid_payment_transition')
    throw new AppError('Completed order payment cannot be changed', 409)
  }
  const updated = await updateOrderPayment(id, paymentStatus)
  logger.info({ orderId: id, paymentStatus, durationMs: elapsedMs(start) }, 'order_payment_updated')
  return updated
}
