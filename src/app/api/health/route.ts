import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const checks: Record<string, string> = {}
  let allOk = true

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
    allOk = false
  }

  const mem = process.memoryUsage()
  checks.memory = `${Math.round(mem.rss / 1024 / 1024)}MB`

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  )
}
