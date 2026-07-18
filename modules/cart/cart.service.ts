import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { addCartItem, clearCart, findActiveProduct, findCartItem, getOrCreateCart, removeCartItem, setCartItemQuantity } from './cart.repository'
import type { AddCartItemInput, UpdateCartItemInput } from './cart.types'

export async function getCartService(userId: number) {
  return getOrCreateCart(userId)
}

export async function addCartItemService(userId: number, input: AddCartItemInput) {
  const product = await findActiveProduct(input.productId)
  if (!product) {
    logger.warn({ userId, productId: input.productId }, 'cart_product_missing')
    throw new AppError('Product not found', 404)
  }

  const existing = await findCartItem(userId, input.productId)
  const nextQuantity = (existing?.quantity ?? 0) + input.quantity
  if (nextQuantity > product.stock) {
    logger.warn({ userId, productId: input.productId, requestedQuantity: nextQuantity, stock: product.stock }, 'cart_quantity_exceeds_stock')
    throw new AppError('Quantity exceeds product stock', 409)
  }

  const item = await addCartItem(userId, input)
  logger.info({ userId, productId: input.productId, quantity: input.quantity }, 'cart_item_added')
  return item
}

export async function updateCartItemService(userId: number, productId: number, input: UpdateCartItemInput) {
  const product = await findActiveProduct(productId)
  if (!product) {
    logger.warn({ userId, productId }, 'cart_product_missing')
    throw new AppError('Product not found', 404)
  }

  const existing = await findCartItem(userId, productId)
  if (!existing) throw new AppError('Cart item not found', 404)
  if (input.quantity > product.stock) {
    logger.warn({ userId, productId, requestedQuantity: input.quantity, stock: product.stock }, 'cart_quantity_exceeds_stock')
    throw new AppError('Quantity exceeds product stock', 409)
  }

  const item = await setCartItemQuantity(userId, productId, input.quantity)
  logger.info({ userId, productId, quantity: input.quantity }, 'cart_item_updated')
  return item
}

export async function removeCartItemService(userId: number, productId: number) {
  const cart = await removeCartItem(userId, productId)
  logger.info({ userId, productId }, 'cart_item_removed')
  return cart
}

export async function clearCartService(userId: number) {
  const cart = await clearCart(userId)
  logger.info({ userId }, 'cart_cleared')
  return cart
}
