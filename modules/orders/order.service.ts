import { AppError } from '@/lib/errors'
import { createOrder, findOrdersByUser } from './order.repository'
import type { CreateOrderInput } from './order.types'

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
