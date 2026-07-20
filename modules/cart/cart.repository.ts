import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'
import type { AddCartItemInput, CartRecord } from './cart.types'

type CartWithItems = {
  id: number
  userId: number
  items: Array<{
    id: number
    productId: number
    quantity: number
    product: {
      name: string
      description: string | null
      price: unknown
      stock: number
    }
  }>
  createdAt: Date
  updatedAt: Date
}

function toCartRecord(cart: CartWithItems): CartRecord {
  const items = cart.items.map((item) => {
    const unitPrice = Number(item.product.price)
    return {
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productDescription: item.product.description,
      unitPrice,
      stock: item.product.stock,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
    }
  })

  return {
    id: cart.id,
    userId: cart.userId,
    items,
    total: items.reduce((sum, item) => sum + item.lineTotal, 0),
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  }
}

const cartInclude = {
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      product: true,
    },
  },
}

export async function getOrCreateCart(userId: number) {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: cartInclude,
  })

  const filteredCart = {
    ...cart,
    items: cart.items.filter((item) => !item.product.deletedAt),
  }

  return toCartRecord(filteredCart)
}

export async function findActiveProduct(productId: number) {
  return prisma.product.findFirst({ where: { id: productId, deletedAt: null } })
}

export async function findCartItem(userId: number, productId: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } })
  if (!cart) return null

  return prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } })
}

export async function addCartItem(userId: number, input: AddCartItemInput) {
  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })

    // Lock product row with FOR UPDATE to prevent race condition
    await tx.$executeRaw`SELECT id FROM "Product" WHERE id = ${input.productId} FOR UPDATE`

    const product = await tx.product.findFirst({
      where: { id: input.productId, deletedAt: null },
    })
    if (!product) throw new AppError('Product not found', 404)

    const existing = await tx.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
    })
    const nextQuantity = (existing?.quantity ?? 0) + input.quantity
    if (nextQuantity > product.stock) throw new AppError('Quantity exceeds product stock', 409)

    await tx.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
      update: { quantity: { increment: input.quantity } },
      create: { cartId: cart.id, productId: input.productId, quantity: input.quantity },
    })

    const fullCart = await tx.cart.findUnique({
      where: { userId },
      include: cartInclude,
    })
    if (!fullCart) throw new AppError('Cart not found', 500)

    return toCartRecord(fullCart)
  })
}

export async function setCartItemQuantity(userId: number, productId: number, quantity: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } })
  if (!cart) return getOrCreateCart(userId)

  if (quantity === 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } })
  } else {
    await prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity },
    })
  }

  return getOrCreateCart(userId)
}

export async function removeCartItem(userId: number, productId: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } })
  if (!cart) return getOrCreateCart(userId)

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } })
  return getOrCreateCart(userId)
}

export async function clearCart(userId: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } })
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  return getOrCreateCart(userId)
}
