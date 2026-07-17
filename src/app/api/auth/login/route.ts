import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSession, resolveSecure } from '@/lib/session'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { hashPassword, comparePassword } from '@/lib/password'
import { parseBody, loginSchema, csrfOk, csrfDenied } from '@/lib/validation'
import { logError } from '@/lib/logger'

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

    if (!csrfOk(request)) return csrfDenied()

    const body = await parseBody(loginSchema, request)
    if (!body.ok) return body.response
    const { account, password } = body.data

    const user = await prisma.user.findUnique({
      where: { email: account },
    })

    if (!user) {
      await hashPassword(password)
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 })
    }

    const secure = resolveSecure({
      proto: request.nextUrl.protocol,
      forwardedProto: request.headers.get('x-forwarded-proto') ?? undefined,
    })
    await createSession(user.id, user.role, user.tokenVersion, { secure })

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
    logError('auth/login', {}, err)
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 })
  }
}
