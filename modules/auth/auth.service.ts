import bcrypt from 'bcryptjs'
import { AppError } from '@/lib/errors'
import { signJwt } from '@/lib/auth'
import { findUserByEmail } from './auth.repository'
import type { LoginInput } from './auth.types'

export async function login(input: LoginInput) {
  const user = await findUserByEmail(input.email)
  if (!user) throw new AppError('Invalid credentials', 401)

  const isValid = await bcrypt.compare(input.password, user.passwordHash)
  if (!isValid) throw new AppError('Invalid credentials', 401)

  const token = await signJwt({ userId: user.id, email: user.email })

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  }
}
