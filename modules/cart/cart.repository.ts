import { prisma } from '@/lib/prisma'
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
      price: number
      stock: number
    }
  }>
  createdAt: Date
  updatedAt: Date
}

function toCartRecord(cart: CartWithItems): CartRecord {
  const items = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    productDescription: item.product.description,
    unitPrice: item.product.price,
    stock: item.product.stock,
    quantity: item.quantity,
    lineTotal: item.product.price * item.quantity,
  }))

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

  return toCartRecord(cart)
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
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
    update: { quantity: { increment: input.quantity } },
    create: { cartId: cart.id, productId: input.productId, quantity: input.quantity },
  })

  return getOrCreateCart(userId)
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
