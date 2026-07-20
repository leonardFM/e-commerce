import { NextRequest } from 'next/server'
import { AppError } from '@/lib/errors'
import { failure, success } from '@/lib/response'
import { getJsonBody, requireRole, requireUser } from '@/lib/request'
import { updateProductSchema } from '@/modules/products/product.schema'
import { deleteProductService, getProductService, updateProductService } from '@/modules/products/product.service'
import { parsePositiveInt } from '@/lib/param'

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product detail
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product detail
 *       404:
 *         description: Product not found
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const { id } = await params
    return success(await getProductService(parsePositiveInt(id, 'product')))
  } catch (error) {
    return failure(error, { feature: 'products', method: request.method, path: request.nextUrl.pathname, userId })
  }
}

/**
 * @openapi
 * /api/products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update product (admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string, nullable: true }
 *               price: { type: number }
 *               stock: { type: integer }
 *     responses:
 *       200:
 *         description: Product updated
 *       403:
 *         description: Forbidden (not admin)
 *       404:
 *         description: Product not found
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: number | undefined
  try {
    const user = await requireRole(request, 'ADMIN')
    userId = user.userId
    const { id } = await params
    const body = updateProductSchema.parse(await getJsonBody(request))
    if (Object.keys(body).length === 0) throw new AppError('Request body cannot be empty', 400)
    return success(await updateProductService(parsePositiveInt(id, 'product'), body))
  } catch (error) {
    return failure(error, { feature: 'products', method: request.method, path: request.nextUrl.pathname, userId })
  }
}

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Soft delete product (admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product deleted (soft)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted: { type: boolean }
 *       403:
 *         description: Forbidden (not admin)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: number | undefined
  try {
    const user = await requireRole(request, 'ADMIN')
    userId = user.userId
    const { id } = await params
    await deleteProductService(parsePositiveInt(id, 'product'))
    return success({ deleted: true })
  } catch (error) {
    return failure(error, { feature: 'products', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
