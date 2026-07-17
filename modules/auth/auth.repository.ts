import { prisma } from '@/lib/prisma'

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}
