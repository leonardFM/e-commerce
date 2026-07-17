import { NextResponse } from 'next/server'
import { AppError } from './errors'
import { ZodError } from 'zod'

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function failure(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Validation error', issues: error.issues }, { status: 400 })
  }

  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode })
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
}
