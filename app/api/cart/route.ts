import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireUser } from '@/lib/request'
import { clearCartService, getCartService } from '@/modules/cart/cart.service'

export async function GET(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    return success(await getCartService(user.userId))
  } catch (error) {
    return failure(error, { feature: 'cart', method: request.method, path: request.nextUrl.pathname, userId })
  }
}

export async function DELETE(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    return success(await clearCartService(user.userId))
  } catch (error) {
    return failure(error, { feature: 'cart', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
