import { AsyncLocalStorage } from 'async_hooks'

export type TokenContext = {
  newToken?: string
  userId?: number
}

const als = new AsyncLocalStorage<TokenContext>()

export function getNewToken(): string | undefined {
  return als.getStore()?.newToken
}

export function setNewToken(token: string): void {
  const store = als.getStore()
  if (store) {
    store.newToken = token
  }
}

export function getUserId(): number | undefined {
  return als.getStore()?.userId
}

export function setUserId(id: number): void {
  const store = als.getStore()
  if (store) {
    store.userId = id
  }
}

export { als }
