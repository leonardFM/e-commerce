export type CreateOrderItemInput = {
  productId: number
  quantity: number
}

export type CreateOrderInput = {
  items: CreateOrderItemInput[]
}

export type OrderItemRecord = {
  id: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
}

export type OrderRecord = {
  id: number
  userId: number
  total: number
  items: OrderItemRecord[]
  createdAt: Date
  updatedAt: Date
}
