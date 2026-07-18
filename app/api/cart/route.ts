import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireUser } from '@/lib/request'
import { clearCartService, getCartService } from '@/modules/cart/cart.service'

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request)
    return success(await getCartService(user.userId))
  } catch (error) {
    return failure(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request)
    return success(await clearCartService(user.userId))
  } catch (error) {
    return failure(error)
  }
}
