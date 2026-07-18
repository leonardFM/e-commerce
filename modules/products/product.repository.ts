import { prisma } from '@/lib/prisma'
import type { CreateProductInput, ListProductsQuery, ProductListResult, ProductRecord, UpdateProductInput } from './product.types'

function toProductRecord(value: {
  id: number
  name: string
  description: string | null
  price: number
  stock: number
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): ProductRecord {
  return value
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
  const product = await prisma.product.update({
    where: { id },
    data,
  })
  return toProductRecord(product)
}

export async function softDeleteProduct(id: number) {
  const product = await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  return toProductRecord(product)
}
