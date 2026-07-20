export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED'
export type PaymentStatus = 'PENDING' | 'PAID'
export type PaymentMethod = 'BANK_TRANSFER' | 'EWALLET' | 'COD'

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
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  paymentReference: string
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingPostalCode: string
  shippingCost: number
  subtotal: number
  total: number
  items: OrderItemRecord[]
  createdAt: Date
  updatedAt: Date
}

export type ListOrdersQuery = {
  page: number
  limit: number
}

export type OrderListResult = {
  items: OrderRecord[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
