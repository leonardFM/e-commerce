import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireRole, requireUser } from '@/lib/request'
import { updateProductSchema } from '@/modules/products/product.schema'
import { deleteProductService, getProductService, updateProductService } from '@/modules/products/product.service'
import { AppError } from '@/lib/errors'

function parseId(id: string) {
  const value = Number(id)
  if (!Number.isInteger(value) || value <= 0) throw new AppError('Invalid product id', 400)
  return value
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(request)
    const { id } = await params
    return success(await getProductService(parseId(id)))
  } catch (error) {
    return failure(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(request, 'ADMIN')
    const { id } = await params
    const body = updateProductSchema.parse(await request.json())
    if (Object.keys(body).length === 0) throw new AppError('Request body cannot be empty', 400)
    return success(await updateProductService(parseId(id), body))
  } catch (error) {
    return failure(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(request, 'ADMIN')
    const { id } = await params
    await deleteProductService(parseId(id))
    return success({ deleted: true })
  } catch (error) {
    return failure(error)
  }
}
