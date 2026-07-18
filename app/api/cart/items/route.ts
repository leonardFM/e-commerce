import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireUser } from '@/lib/request'
import { addCartItemSchema } from '@/modules/cart/cart.schema'
import { addCartItemService } from '@/modules/cart/cart.service'

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const body = addCartItemSchema.parse(await request.json())
    return success(await addCartItemService(user.userId, body), 201)
  } catch (error) {
    return failure(error)
  }
}
