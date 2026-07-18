export type PaymentMethod = 'BANK_TRANSFER' | 'EWALLET' | 'COD'
export type SimulatedPaymentStatus = 'PAID' | 'PENDING' | 'FAILED'

export type SimulatePaymentInput = {
  paymentMethod: PaymentMethod
  simulatePaymentStatus?: SimulatedPaymentStatus
}

export type PaymentSimulationResult = {
  paymentStatus: Exclude<SimulatedPaymentStatus, 'FAILED'>
  paymentReference: string
}
