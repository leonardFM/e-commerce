import { randomUUID } from 'crypto'
import { AppError } from '@/lib/errors'
import type { PaymentSimulationResult, SimulatePaymentInput } from './payment.types'

function generatePaymentReference() {
  return `PAY-${randomUUID()}`
}

export function simulatePayment(input: SimulatePaymentInput): PaymentSimulationResult {
  if (input.simulatePaymentStatus === 'FAILED') throw new AppError('Payment failed', 402)

  const paymentStatus = input.simulatePaymentStatus ?? (input.paymentMethod === 'EWALLET' ? 'PAID' : 'PENDING')

  return {
    paymentStatus,
    paymentReference: generatePaymentReference(),
  }
}
