import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { csrfOk, csrfDenied } from '@/lib/validation'
import { logError } from '@/lib/logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!csrfOk(request)) return csrfDenied()

    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { id } = await params

    const record = await prisma.toolRecord.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!record || record.userId !== session.userId) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }

    await prisma.toolRecord.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    logError('ai/history/delete', {}, err)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
