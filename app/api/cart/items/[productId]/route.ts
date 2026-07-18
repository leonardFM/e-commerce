import { NextRequest } from 'next/server'
import { AppError } from '@/lib/errors'
import { failure, success } from '@/lib/response'
import { requireUser } from '@/lib/request'
import { updateCartItemSchema } from '@/modules/cart/cart.schema'
import { removeCartItemService, updateCartItemService } from '@/modules/cart/cart.service'

function parseProductId(value: string) {
  const productId = Number(value)
  if (!Number.isInteger(productId) || productId <= 0) throw new AppError('Invalid product id', 400)
  return productId
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const { productId } = await params
    const body = updateCartItemSchema.parse(await request.json())
    return success(await updateCartItemService(user.userId, parseProductId(productId), body))
  } catch (error) {
    return failure(error, { feature: 'cart_items', method: request.method, path: request.nextUrl.pathname, userId })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const { productId } = await params
    return success(await removeCartItemService(user.userId, parseProductId(productId)))
  } catch (error) {
    return failure(error, { feature: 'cart_items', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
