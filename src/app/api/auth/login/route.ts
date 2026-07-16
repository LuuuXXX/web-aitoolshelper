import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/session'
import { isEmail } from '@/lib/utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limited = rateLimit(`login:${ip}`, 10, 60_000)
    if (!limited.allowed) {
      return NextResponse.json(
        { error: '登录尝试过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { account, password } = body

    if (!account || !password) {
      return NextResponse.json({ error: '请填写账号和密码' }, { status: 400 })
    }

    if (!isEmail(account)) {
      return NextResponse.json({ error: '请输入有效的邮箱' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: account },
    })

    if (!user) {
      await bcrypt.hash(password, 12)
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 })
    }

    await createSession(user.id, user.role, user.tokenVersion)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 })
  }
}
