import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'
import type { CreateOrderInput, ListOrdersQuery, OrderRecord } from './order.types'

const insufficientStockMessage = 'Insufficient stock for one or more products'

export function toOrderRecord(order: {
  id: number
  userId: number
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED'
  paymentStatus: 'PENDING' | 'PAID'
  paymentMethod: 'BANK_TRANSFER' | 'EWALLET' | 'COD'
  paymentReference: string
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingPostalCode: string
  shippingCost: number
  subtotal: number
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
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    shippingName: order.shippingName,
    shippingPhone: order.shippingPhone,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingPostalCode: order.shippingPostalCode,
    shippingCost: order.shippingCost,
    subtotal: order.subtotal,
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
      if (product.stock < item.quantity) throw new AppError(insufficientStockMessage, 409)
    }

    const stockSnapshots = new Map<number, { before: number; after: number }>()

    for (const item of groupedItems) {
      const product = productMap.get(item.productId)
      if (!product) throw new AppError('One or more products not found', 404)
      const stockBefore = product.stock
      const stockAfter = stockBefore - item.quantity
      const result = await tx.product.updateMany({
        where: {
          id: item.productId,
          deletedAt: null,
          stock: stockBefore,
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })

      if (result.count !== 1) {
        throw new AppError(insufficientStockMessage, 409)
      }

      stockSnapshots.set(item.productId, { before: stockBefore, after: stockAfter })
    }

    const total = groupedItems.reduce((sum, item) => {
      const product = productMap.get(item.productId)
      return sum + (product ? product.price * item.quantity : 0)
    }, 0)

    const order = await tx.order.create({
      data: {
        userId,
        status: 'PAID',
        paymentStatus: 'PAID',
        paymentMethod: 'EWALLET',
        paymentReference: `LEGACY-${Date.now()}`,
        shippingName: 'Legacy checkout',
        shippingPhone: '-',
        shippingAddress: '-',
        shippingCity: '-',
        shippingPostalCode: '-',
        shippingCost: 0,
        subtotal: total,
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

    await tx.inventoryMovement.createMany({
      data: groupedItems.map((item) => {
        const snapshot = stockSnapshots.get(item.productId)
        if (!snapshot) throw new AppError('Stock snapshot not found', 500)

        return {
          productId: item.productId,
          userId,
          orderId: order.id,
          type: 'ORDER_CHECKOUT',
          quantityChange: -item.quantity,
          stockBefore: snapshot.before,
          stockAfter: snapshot.after,
          note: `Order #${order.id}`,
        }
      }),
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

export async function findOrderByUser(id: number, userId: number) {
  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  })

  return order ? toOrderRecord(order) : null
}

export async function listOrdersForAdmin(query: ListOrdersQuery) {
  const [total, items] = await prisma.$transaction([
    prisma.order.count(),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        items: {
          include: { product: true },
        },
      },
    }),
  ])

  return {
    items: items.map(toOrderRecord),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  }
}

export async function updateOrderStatus(id: number, status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED') {
  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      items: {
        include: { product: true },
      },
    },
  })

  return toOrderRecord(order)
}

export async function updateOrderPayment(id: number, paymentStatus: 'PENDING' | 'PAID') {
  const order = await prisma.order.update({
    where: { id },
    data: {
      paymentStatus,
      ...(paymentStatus === 'PAID' ? { status: 'PAID' as const } : {}),
    },
    include: {
      items: {
        include: { product: true },
      },
    },
  })

  return toOrderRecord(order)
}

export async function findOrderById(id: number) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
      },
    },
  })

  return order ? toOrderRecord(order) : null
}
