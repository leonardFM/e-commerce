import { prisma } from '@/lib/prisma'
import type { ListOrdersQuery, OrderRecord } from './order.types'

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
  shippingCost: unknown
  subtotal: unknown
  total: unknown
  items: Array<{
    id: number
    productId: number
    productName: string
    quantity: number
    unitPrice: unknown
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
    shippingCost: Number(order.shippingCost),
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
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
  if (paymentStatus === 'PAID') {
    const result = await prisma.order.updateMany({
      where: { id, status: 'PENDING' },
      data: { paymentStatus: 'PAID', status: 'PAID' },
    })

    if (result.count === 0) {
      const order = await prisma.order.update({
        where: { id },
        data: { paymentStatus: 'PAID' },
        include: {
          items: {
            include: { product: true },
          },
        },
      })
      return toOrderRecord(order)
    }

    const order = await prisma.order.findUniqueOrThrow({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    })
    return toOrderRecord(order)
  }

  const order = await prisma.order.update({
    where: { id },
    data: { paymentStatus },
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
