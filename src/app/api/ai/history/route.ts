import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { logError } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const toolId = searchParams.get('toolId')
    const rawPage = Number(searchParams.get('page')) || 1
    const rawPageSize = Number(searchParams.get('pageSize')) || 10
    const page = Math.max(1, Math.floor(rawPage))
    const pageSize = Math.min(50, Math.max(1, Math.floor(rawPageSize)))

    const where: Record<string, unknown> = { userId: session.userId }
    if (toolId) where.toolId = toolId

    const [records, total] = await Promise.all([
      prisma.toolRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.toolRecord.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    logError('ai/history', { userId: 'unknown' }, err)
    return NextResponse.json({ error: '获取历史记录失败' }, { status: 500 })
  }
}
