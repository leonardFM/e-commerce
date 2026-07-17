export type ProductRecord = {
  id: number
  name: string
  description: string | null
  price: number
  stock: number
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type CreateProductInput = {
  name: string
  description?: string | null
  price: number
  stock: number
}

export type UpdateProductInput = Partial<CreateProductInput>

export type ListProductsQuery = {
  page: number
  limit: number
  search?: string
}

export type ProductListResult = {
  items: ProductRecord[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
