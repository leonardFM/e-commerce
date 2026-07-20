import { NextRequest } from 'next/server'
import { createProductSchema, listProductsQuerySchema } from '@/modules/products/product.schema'
import { createProductService, listProductsService } from '@/modules/products/product.service'
import { failure, success } from '@/lib/response'
import { getJsonBody, requireRole, requireUser } from '@/lib/request'

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List products (paginated, searchable)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search products by name
 *     responses:
 *       200:
 *         description: Paginated product list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductRecord'
 *                     meta:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product (admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: Wireless Mouse }
 *               description: { type: string, nullable: true }
 *               price: { type: number, example: 150000 }
 *               stock: { type: integer, example: 50 }
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ProductRecord'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 */
export async function POST(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireRole(request, 'ADMIN')
    userId = user.userId
    const body = createProductSchema.parse(await getJsonBody(request))
    return success(await createProductService(body), 201)
  } catch (error) {
    return failure(error, { feature: 'products', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
