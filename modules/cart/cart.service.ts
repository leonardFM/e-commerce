import { AppError } from '@/lib/errors'
import { addCartItem, clearCart, findActiveProduct, findCartItem, getOrCreateCart, removeCartItem, setCartItemQuantity } from './cart.repository'
import type { AddCartItemInput, UpdateCartItemInput } from './cart.types'

export async function getCartService(userId: number) {
  return getOrCreateCart(userId)
}

export async function addCartItemService(userId: number, input: AddCartItemInput) {
  const product = await findActiveProduct(input.productId)
  if (!product) throw new AppError('Product not found', 404)

  const existing = await findCartItem(userId, input.productId)
  const nextQuantity = (existing?.quantity ?? 0) + input.quantity
  if (nextQuantity > product.stock) throw new AppError('Quantity exceeds product stock', 409)

  return addCartItem(userId, input)
}

export async function updateCartItemService(userId: number, productId: number, input: UpdateCartItemInput) {
  const product = await findActiveProduct(productId)
  if (!product) throw new AppError('Product not found', 404)

  const existing = await findCartItem(userId, productId)
  if (!existing) throw new AppError('Cart item not found', 404)
  if (input.quantity > product.stock) throw new AppError('Quantity exceeds product stock', 409)

  return setCartItemQuantity(userId, productId, input.quantity)
}

export async function removeCartItemService(userId: number, productId: number) {
  return removeCartItem(userId, productId)
}

export async function clearCartService(userId: number) {
  return clearCart(userId)
}
