import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireUser } from '@/lib/request'
import { addCartItemSchema } from '@/modules/cart/cart.schema'
import { addCartItemService } from '@/modules/cart/cart.service'

export async function POST(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const body = addCartItemSchema.parse(await request.json())
    return success(await addCartItemService(user.userId, body), 201)
  } catch (error) {
    return failure(error, { feature: 'cart_items', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
