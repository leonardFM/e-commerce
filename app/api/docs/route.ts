import { NextResponse } from 'next/server'
import { apiDocument } from '@/lib/swagger'

export async function GET() {
  return NextResponse.json(apiDocument)
}
