import { AppError } from '@/lib/errors'
import { createProduct, findProductById, listProducts, softDeleteProduct, updateProduct } from './product.repository'
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './product.types'

export async function createProductService(input: CreateProductInput) {
  return createProduct(input)
}

export async function listProductsService(query: ListProductsQuery) {
  return listProducts(query)
}

export async function getProductService(id: number) {
  const product = await findProductById(id)
  if (!product) throw new AppError('Product not found', 404)
  return product
}

export async function updateProductService(id: number, input: UpdateProductInput) {
  await getProductService(id)
  return updateProduct(id, input)
}

export async function deleteProductService(id: number) {
  const product = await getProductService(id)
  if (product.deletedAt) throw new AppError('Product not found', 404)
  return softDeleteProduct(id)
}
