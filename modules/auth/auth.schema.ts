import { z } from 'zod'
import { sanitize } from '@/lib/sanitize'

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(10).max(128),
})

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(10).max(128),
  name: z.string().trim().max(100).optional().transform((v) => (v ? sanitize(v) : v)),
})
