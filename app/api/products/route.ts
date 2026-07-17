import { NextRequest } from 'next/server'
import { createProductSchema, listProductsQuerySchema } from '@/modules/products/product.schema'
import { createProductService, listProductsService } from '@/modules/products/product.service'
import { failure, success } from '@/lib/response'
import { requireUser } from '@/lib/request'

export async function GET(request: NextRequest) {
  try {
    await requireUser(request)
    const query = listProductsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    return success(await listProductsService(query))
  } catch (error) {
    return failure(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireUser(request)
    const body = createProductSchema.parse(await request.json())
    return success(await createProductService(body), 201)
  } catch (error) {
    return failure(error)
  }
}
