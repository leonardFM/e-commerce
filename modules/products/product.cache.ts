import { createHash } from 'crypto'
import { deleteCacheByPrefix, deleteCacheKey } from '@/lib/cache'
import type { ListProductsQuery, ProductListResult, ProductRecord } from './product.types'

export const PRODUCT_CACHE_TTL_SECONDS = 60
export const HOMEPAGE_FEATURED_PRODUCTS_CACHE_KEY = 'homepage:featured-products'
export const PRODUCT_LIST_CACHE_PREFIX = 'products:list:'

export function productListCacheKey(query: ListProductsQuery) {
  const normalized = JSON.stringify({
    page: query.page,
    limit: query.limit,
    search: query.search ?? '',
  })
  const hash = createHash('sha256').update(normalized).digest('hex')
  return `${PRODUCT_LIST_CACHE_PREFIX}${hash}`
}

export function productDetailCacheKey(productId: number) {
  return `products:detail:${productId}`
}

export async function invalidateProductCaches(productId?: number) {
  await Promise.all([
    deleteCacheKey(HOMEPAGE_FEATURED_PRODUCTS_CACHE_KEY),
    deleteCacheByPrefix(PRODUCT_LIST_CACHE_PREFIX),
    productId ? deleteCacheKey(productDetailCacheKey(productId)) : Promise.resolve(),
  ])
}

export function toCachedProductRecord(product: ProductRecord) {
  return {
    ...product,
    deletedAt: product.deletedAt?.toISOString() ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }
}

export function fromCachedProductRecord(product: ReturnType<typeof toCachedProductRecord>): ProductRecord {
  return {
    ...product,
    deletedAt: product.deletedAt ? new Date(product.deletedAt) : null,
    createdAt: new Date(product.createdAt),
    updatedAt: new Date(product.updatedAt),
  }
}

export function toCachedProductList(result: ProductListResult) {
  return {
    ...result,
    items: result.items.map(toCachedProductRecord),
  }
}

export function fromCachedProductList(result: ReturnType<typeof toCachedProductList>): ProductListResult {
  return {
    ...result,
    items: result.items.map(fromCachedProductRecord),
  }
}
