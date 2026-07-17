import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { deleteSession } from '@/lib/session'
import { parseBody, userDeleteSchema, csrfOk, csrfDenied } from '@/lib/validation'
import { logError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    if (!csrfOk(request)) return csrfDenied()

    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await parseBody(userDeleteSchema, request)
    if (!body.ok) return body.response

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.userId },
        data: {
          email: null,
          phone: null,
          name: '已注销用户',
          avatar: null,
          passwordHash: crypto.randomUUID() + crypto.randomUUID(),
          tokenVersion: { increment: 1 },
          deletedAt: new Date(),
        },
      })
      await tx.toolRecord.deleteMany({ where: { userId: session.userId } })
    })

    await deleteSession()

    return NextResponse.json({ success: true })
  } catch (err) {
    logError('user/delete', {}, err)
    return NextResponse.json({ error: '注销失败' }, { status: 500 })
  }
}
