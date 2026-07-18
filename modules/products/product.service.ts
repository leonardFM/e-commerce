import { AppError } from '@/lib/errors'
import { getJsonCache, setJsonCache } from '@/lib/cache'
import { createProduct, findProductById, listFeaturedProducts, listProducts, softDeleteProduct, updateProduct } from './product.repository'
import {
  HOMEPAGE_FEATURED_PRODUCTS_CACHE_KEY,
  PRODUCT_CACHE_TTL_SECONDS,
  fromCachedProductList,
  fromCachedProductRecord,
  invalidateProductCaches,
  productDetailCacheKey,
  productListCacheKey,
  toCachedProductList,
  toCachedProductRecord,
} from './product.cache'
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './product.types'

export async function createProductService(input: CreateProductInput) {
  const product = await createProduct(input)
  await invalidateProductCaches(product.id)
  return product
}

export async function listProductsService(query: ListProductsQuery) {
  const cacheKey = productListCacheKey(query)
  const cached = await getJsonCache<ReturnType<typeof toCachedProductList>>(cacheKey)
  if (cached) return fromCachedProductList(cached)

  const products = await listProducts(query)
  await setJsonCache(cacheKey, toCachedProductList(products), PRODUCT_CACHE_TTL_SECONDS)
  return products
}

export async function getProductService(id: number) {
  const cacheKey = productDetailCacheKey(id)
  const cached = await getJsonCache<ReturnType<typeof toCachedProductRecord>>(cacheKey)
  const product = cached ? fromCachedProductRecord(cached) : await findProductById(id)
  if (!product) throw new AppError('Product not found', 404)
  if (!cached) await setJsonCache(cacheKey, toCachedProductRecord(product), PRODUCT_CACHE_TTL_SECONDS)
  return product
}

export async function listFeaturedProductsService() {
  const cached = await getJsonCache<ReturnType<typeof toCachedProductRecord>[]>(HOMEPAGE_FEATURED_PRODUCTS_CACHE_KEY)
  if (cached) return cached.map(fromCachedProductRecord)

  const products = await listFeaturedProducts()
  await setJsonCache(HOMEPAGE_FEATURED_PRODUCTS_CACHE_KEY, products.map(toCachedProductRecord), PRODUCT_CACHE_TTL_SECONDS)
  return products
}

export async function updateProductService(id: number, input: UpdateProductInput) {
  await getProductService(id)
  const product = await updateProduct(id, input)
  await invalidateProductCaches(id)
  return product
}

export async function deleteProductService(id: number) {
  const product = await getProductService(id)
  if (product.deletedAt) throw new AppError('Product not found', 404)
  const deletedProduct = await softDeleteProduct(id)
  await invalidateProductCaches(id)
  return deletedProduct
}
