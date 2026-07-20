import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'
import type { CreateProductInput, ListProductsQuery, ProductListResult, ProductRecord, UpdateProductInput } from './product.types'

function toProductRecord(value: {
  id: number
  name: string
  description: string | null
  price: unknown
  stock: number
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): ProductRecord {
  return { ...value, price: Number(value.price) }
}

export async function createProduct(data: CreateProductInput) {
  const product = await prisma.product.create({ data })
  return toProductRecord(product)
}

export async function findProductById(id: number) {
  const product = await prisma.product.findFirst({ where: { id, deletedAt: null } })
  return product ? toProductRecord(product) : null
}

export async function listProducts(query: ListProductsQuery): Promise<ProductListResult> {
  const where = {
    deletedAt: null as Date | null,
    ...(query.search
      ? {
          name: {
            contains: query.search,
            mode: 'insensitive' as const,
          },
        }
      : {}),
  }

  const [total, items] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ])

  return {
    items: items.map(toProductRecord),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  }
}

export async function listFeaturedProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return products.map(toProductRecord)
}

export async function updateProduct(id: number, data: UpdateProductInput) {
  const product = await prisma.product.updateMany({
    where: { id, deletedAt: null },
    data,
  })
  if (product.count === 0) throw new AppError('Product not found', 404)
  return toProductRecord(await prisma.product.findUniqueOrThrow({ where: { id } }))
}

export async function softDeleteProduct(id: number) {
  const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } })
  if (!existing) throw new AppError('Product not found', 404)
  const product = await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  return toProductRecord(product)
}
