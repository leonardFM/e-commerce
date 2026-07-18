import { AppError } from '@/lib/errors'
import { createOrder, findOrderById, findOrderByUser, findOrdersByUser, listOrdersForAdmin, updateOrderPayment, updateOrderStatus } from './order.repository'
import type { CreateOrderInput, ListOrdersQuery, OrderStatus, PaymentStatus } from './order.types'

export async function createOrderService(userId: number, input: CreateOrderInput) {
  try {
    return await createOrder(userId, input)
  } catch (error) {
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
  const order = await findOrderById(id)
  if (!order) throw new AppError('Order not found', 404)
  if (order.status === 'COMPLETED' && status !== 'COMPLETED') throw new AppError('Completed order status cannot be changed', 409)
  return updateOrderStatus(id, status)
}

export async function updateOrderPaymentService(id: number, paymentStatus: PaymentStatus) {
  const order = await findOrderById(id)
  if (!order) throw new AppError('Order not found', 404)
  if (order.status === 'COMPLETED' && paymentStatus !== order.paymentStatus) throw new AppError('Completed order payment cannot be changed', 409)
  return updateOrderPayment(id, paymentStatus)
}
