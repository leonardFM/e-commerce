import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'
import { toOrderRecord } from '@/modules/orders/order.repository'
import type { CheckoutInput } from './checkout.types'

export async function validateCheckoutCart(userId: number) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400)

  for (const item of cart.items) {
    if (item.product.deletedAt) throw new AppError('One or more products not found', 404)
    if (item.product.stock < item.quantity) throw new AppError(`Insufficient stock for product ${item.product.name}`, 409)
  }
}

export async function checkoutCart(userId: number, input: CheckoutInput, payment: { paymentStatus: 'PAID' | 'PENDING'; paymentReference: string }) {
  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400)

    for (const item of cart.items) {
      if (item.product.deletedAt) throw new AppError('One or more products not found', 404)
      if (item.product.stock < item.quantity) throw new AppError(`Insufficient stock for product ${item.product.name}`, 409)
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const total = subtotal + input.shippingCost
    const stockSnapshots = new Map<number, { before: number; after: number }>()

    for (const item of cart.items) {
      const stockBefore = item.product.stock
      const stockAfter = stockBefore - item.quantity
      const result = await tx.product.updateMany({
        where: {
          id: item.productId,
          deletedAt: null,
          stock: item.product.stock,
        },
        data: {
          stock: { decrement: item.quantity },
        },
      })

      if (result.count !== 1) throw new AppError(`Insufficient stock for product ${item.product.name}`, 409)
      stockSnapshots.set(item.productId, { before: stockBefore, after: stockAfter })
    }

    const order = await tx.order.create({
      data: {
        userId,
        status: payment.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
        paymentStatus: payment.paymentStatus,
        paymentMethod: input.paymentMethod,
        paymentReference: payment.paymentReference,
        shippingName: input.shippingName,
        shippingPhone: input.shippingPhone,
        shippingAddress: input.shippingAddress,
        shippingCity: input.shippingCity,
        shippingPostalCode: input.shippingPostalCode,
        shippingCost: input.shippingCost,
        subtotal,
        total,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    await tx.inventoryMovement.createMany({
      data: cart.items.map((item) => {
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
          note: `Checkout order #${order.id}`,
        }
      }),
    })

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

    return toOrderRecord(order)
  })
}
