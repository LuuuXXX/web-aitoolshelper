import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logError } from '@/lib/logger'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    logError('health', {}, err)
    return NextResponse.json({ status: 'error' }, { status: 503 })
  }
}
