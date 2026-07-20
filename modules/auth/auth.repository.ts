import { prisma } from '@/lib/prisma'

type CreateCustomerUserInput = {
  email: string
  passwordHash: string
  name?: string | null
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export function createCustomerUser(input: CreateCustomerUserInput) {
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name,
      role: 'CUSTOMER',
    },
  })
}
