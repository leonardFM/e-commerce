export type CartItemRecord = {
  id: number
  productId: number
  productName: string
  productDescription: string | null
  unitPrice: number
  stock: number
  quantity: number
  lineTotal: number
}

export type CartRecord = {
  id: number
  userId: number
  items: CartItemRecord[]
  total: number
  createdAt: Date
  updatedAt: Date
}

export type AddCartItemInput = {
  productId: number
  quantity: number
}

export type UpdateCartItemInput = {
  quantity: number
}
