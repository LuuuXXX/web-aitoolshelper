import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { parseBody, userUpdateSchema, csrfOk, csrfDenied } from '@/lib/validation'
import { logError } from '@/lib/logger'

export async function GET() {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        plan: true,
        planExpire: true,
        dailyLimit: true,
        usedToday: true,
        lastUseDate: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const usedToday = user.lastUseDate && user.lastUseDate >= today ? user.usedToday : 0

    return NextResponse.json({
      success: true,
      user: { ...user, usedToday },
    })
  } catch (err) {
    logError('user/get', {}, err)
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!csrfOk(request)) return csrfDenied()

    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await parseBody(userUpdateSchema, request)
    if (!body.ok) return body.response
    const { name, avatar } = body.data

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar: avatar || null }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        plan: true,
        planExpire: true,
        dailyLimit: true,
        usedToday: true,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (err) {
    logError('user/update', {}, err)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
