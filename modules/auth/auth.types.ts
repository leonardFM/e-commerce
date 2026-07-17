export type LoginInput = {
  email: string
  password: string
}

export type AuthUser = {
  id: number
  email: string
  name: string | null
}
