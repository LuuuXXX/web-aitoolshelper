import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateCode, isEmail } from '@/lib/utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendVerificationCode } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const ipLimited = rateLimit(`sendcode:${ip}`, 3, 60_000)
    if (!ipLimited.allowed) {
      return NextResponse.json({ error: '发送过于频繁，请稍后再试' }, { status: 429 })
    }

    const body = await request.json()
    const { target, type: rawType = 'register' } = body

    const type = rawType === 'register' || rawType === 'reset' ? rawType : 'register'

    if (!target) {
      return NextResponse.json({ error: '请输入邮箱' }, { status: 400 })
    }

    if (!isEmail(target)) {
      return NextResponse.json({ error: '请输入有效的邮箱' }, { status: 400 })
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
    console.error('Send code error:', err)
    return NextResponse.json({ error: '发送失败，请稍后重试' }, { status: 500 })
  }
}
