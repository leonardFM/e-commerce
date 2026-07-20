import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'
import { toOrderRecord } from '@/modules/orders/order.repository'
import type { OrderRecord } from '@/modules/orders/order.types'
import type { CheckoutInput } from './checkout.types'

type CheckoutCartResult = OrderRecord & {
  affectedProductIds: number[]
}

const insufficientStockMessage = 'Insufficient stock for one or more products'

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
    if (item.product.stock < item.quantity) throw new AppError(insufficientStockMessage, 409)
  }
}

export async function checkoutCart(userId: number, input: CheckoutInput, payment: { paymentStatus: 'PAID' | 'PENDING'; paymentReference: string }): Promise<CheckoutCartResult> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userId})`

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
    }

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
    const total = subtotal + input.shippingCost

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) throw new AppError(insufficientStockMessage, 409)
    }

    // Lock product rows with FOR UPDATE before stock decrement
    for (const item of cart.items) {
      await tx.$executeRaw`SELECT stock FROM "Product" WHERE id = ${item.productId} FOR UPDATE`
    }

    const stockSnapshots = new Map<number, { before: number; after: number }>()

    for (const item of cart.items) {
      const result = await tx.product.updateMany({
        where: {
          id: item.productId,
          deletedAt: null,
          stock: { gte: item.quantity },
        },
        data: {
          stock: { decrement: item.quantity },
        },
      })

      if (result.count !== 1) throw new AppError(insufficientStockMessage, 409)
    }

    // Read actual stock after update for accurate audit trail
    for (const item of cart.items) {
      const updated = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stock: true },
      })
      if (!updated) throw new AppError('Product not found', 404)
      stockSnapshots.set(item.productId, {
        before: updated.stock + item.quantity,
        after: updated.stock,
      })
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
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: Number(item.product.price),
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

    return {
      ...toOrderRecord(order),
      affectedProductIds: cart.items.map((item) => item.productId),
    }
  })
}
