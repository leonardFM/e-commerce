import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireUser } from '@/lib/request'
import { checkoutSchema } from '@/modules/checkout/checkout.schema'
import { checkoutService } from '@/modules/checkout/checkout.service'

export async function POST(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const body = checkoutSchema.parse(await request.json())
    return success(await checkoutService(user.userId, body), 201)
  } catch (error) {
    return failure(error, { feature: 'checkout', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
