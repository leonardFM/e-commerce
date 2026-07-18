import { NextRequest } from 'next/server'
import { createProductSchema, listProductsQuerySchema } from '@/modules/products/product.schema'
import { createProductService, listProductsService } from '@/modules/products/product.service'
import { failure, success } from '@/lib/response'
import { requireRole, requireUser } from '@/lib/request'

export async function GET(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const query = listProductsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    return success(await listProductsService(query))
  } catch (error) {
    return failure(error, { feature: 'products', method: request.method, path: request.nextUrl.pathname, userId })
  }
}

export async function POST(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireRole(request, 'ADMIN')
    userId = user.userId
    const body = createProductSchema.parse(await request.json())
    return success(await createProductService(body), 201)
  } catch (error) {
    return failure(error, { feature: 'products', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
