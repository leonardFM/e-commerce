export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
  name?: string
}

export type AuthUser = {
  id: number
  email: string
  name: string | null
  role: 'ADMIN' | 'CUSTOMER'
}
