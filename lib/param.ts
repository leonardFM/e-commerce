import { AppError } from './errors'

export function parsePositiveInt(value: string, label = 'id') {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`Invalid ${label} id`, 400)
  }
  return parsed
}
