import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSession, resolveSecure } from '@/lib/session'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { hashPassword } from '@/lib/password'
import { parseBody, registerSchema, csrfOk, csrfDenied } from '@/lib/validation'
import { logError } from '@/lib/logger'

const REGISTER_FAIL = { error: '验证码无效或已过期', status: 400 }

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

    if (!csrfOk(request)) return csrfDenied()

    const body = await parseBody(registerSchema, request)
    if (!body.ok) return body.response
    const { account, password, code, name } = body.data

    const attemptLimited = rateLimit(`verify:${account}`, 5, 300_000)
    if (!attemptLimited.allowed) {
      return NextResponse.json({ error: '验证尝试次数过多，请5分钟后再试' }, { status: 429 })
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
      return NextResponse.json(REGISTER_FAIL, { status: REGISTER_FAIL.status })
    }

    const existing = await prisma.user.findUnique({
      where: { email: account },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(REGISTER_FAIL, { status: REGISTER_FAIL.status })
    }

    const passwordHash = await hashPassword(password)

    let user
    try {
      user = await prisma.$transaction(async (tx) => {
        const consumed = await tx.verificationCode.updateMany({
          where: { id: record.id, used: false },
          data: { used: true },
        })
        if (consumed.count === 0) throw new Error('code_already_used')

        return tx.user.create({
          data: {
            email: account,
            passwordHash,
            name: name || account.split('@')[0],
          },
        })
      })
    } catch (err) {
      logError('auth/register', { account }, err)
      return NextResponse.json(REGISTER_FAIL, { status: REGISTER_FAIL.status })
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
    logError('auth/register', {}, err)
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 })
  }
}
