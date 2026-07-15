import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/session'
import { isEmail } from '@/lib/utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { isEmailConfigured } from '@/lib/email'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limited = rateLimit(`register:${ip}`, 5, 60_000)
    if (!limited.allowed) {
      return NextResponse.json(
        { error: '操作过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { account, password, code, name } = body

    if (!account || !password) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 })
    }

    if (!isEmail(account)) {
      return NextResponse.json({ error: '请输入有效的邮箱' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({
      where: { email: account },
    })

    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 })
    }

    if (!code) {
      return NextResponse.json({ error: '请输入验证码' }, { status: 400 })
    }

    const record = await prisma.verificationCode.findFirst({
      where: {
        target: account,
        code,
        type: 'register',
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
      return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 })
    }

    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email: account,
        passwordHash,
        name: name || account.split('@')[0],
      },
    })

    await createSession(user.id, user.role)

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
    console.error('Register error:', err)
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 })
  }
}
