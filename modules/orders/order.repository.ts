import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'
import type { CreateOrderInput, OrderRecord } from './order.types'

function toOrderRecord(order: {
  id: number
  userId: number
  total: number
  items: Array<{
    id: number
    productId: number
    quantity: number
    unitPrice: number
    product: { name: string }
  }>
  createdAt: Date
  updatedAt: Date
}): OrderRecord {
  return {
    id: order.id,
    userId: order.userId,
    total: order.total,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

export async function createOrder(userId: number, input: CreateOrderInput) {
  return prisma.$transaction(async (tx) => {
    const groupedItems = Object.values(
      input.items.reduce<Record<number, { productId: number; quantity: number }>>((acc, item) => {
        const existing = acc[item.productId]
        acc[item.productId] = {
          productId: item.productId,
          quantity: (existing?.quantity ?? 0) + item.quantity,
        }
        return acc
      }, {}),
    )

    const productIds = groupedItems.map((item) => item.productId)
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        deletedAt: null,
      },
    })

    if (products.length !== productIds.length) {
      throw new AppError('One or more products not found', 404)
    }

    const productMap = new Map(products.map((product) => [product.id, product]))

    for (const item of groupedItems) {
      const product = productMap.get(item.productId)
      if (!product) throw new AppError('One or more products not found', 404)
      if (product.stock < item.quantity) throw new AppError(`Insufficient stock for product ${product.name}`, 409)
    }

    for (const item of groupedItems) {
      const result = await tx.product.updateMany({
        where: {
          id: item.productId,
          deletedAt: null,
          stock: {
            gte: item.quantity,
          },
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })

      if (result.count !== 1) {
        const product = productMap.get(item.productId)
        throw new AppError(`Insufficient stock for product ${product?.name ?? item.productId}`, 409)
      }
    }

    const total = groupedItems.reduce((sum, item) => {
      const product = productMap.get(item.productId)
      return sum + (product ? product.price * item.quantity : 0)
    }, 0)

    const order = await tx.order.create({
      data: {
        userId,
        total,
        items: {
          create: groupedItems.map((item) => {
            const product = productMap.get(item.productId)
            if (!product) throw new AppError('One or more products not found', 404)

            return {
              productId: product.id,
              quantity: item.quantity,
              unitPrice: product.price,
            }
          }),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return toOrderRecord(order)
  })
}

export async function findOrdersByUser(userId: number) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: { product: true },
      },
    },
  })

  return orders.map(toOrderRecord)
}
