import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateCode } from '@/lib/utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendVerificationCode } from '@/lib/email'
import { parseBody, sendCodeSchema, csrfOk, csrfDenied } from '@/lib/validation'
import { logError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const ipLimited = rateLimit(`sendcode:${ip}`, 3, 60_000)
    if (!ipLimited.allowed) {
      return NextResponse.json({ error: '发送过于频繁，请稍后再试' }, { status: 429 })
    }

    if (!csrfOk(request)) return csrfDenied()

    const body = await parseBody(sendCodeSchema, request)
    if (!body.ok) return body.response
    const { target, type } = body.data

    const targetLimited = rateLimit(`sendcode:${target}`, 5, 3600_000)
    if (!targetLimited.allowed) {
      return NextResponse.json({ error: '该邮箱发送次数已达上限，请明天再试' }, { status: 429 })
    }

    const recent = await prisma.verificationCode.findFirst({
      where: {
        target,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    })
    if (recent) {
      return NextResponse.json({ error: '发送太频繁，请60秒后再试' }, { status: 429 })
    }

    if (type === 'reset') {
      const existing = await prisma.user.findUnique({
        where: { email: target },
        select: { id: true },
      })
      if (!existing) {
        return NextResponse.json({ success: true, message: '如果该邮箱已注册，验证码已发送' })
      }
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.verificationCode.create({
      data: { target, code, type, expiresAt },
    })

    const sent = await sendVerificationCode(target, code, type)

    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        message: '验证码已发送',
        devCode: code,
      })
    }

    if (!sent) {
      return NextResponse.json(
        { error: '邮件发送失败，请稍后重试或联系管理员' },
        { status: 503 }
      )
    }

    return NextResponse.json({ success: true, message: '验证码已发送' })
  } catch (err) {
    logError('auth/send-code', {}, err)
    return NextResponse.json({ error: '发送失败，请稍后重试' }, { status: 500 })
  }
}
