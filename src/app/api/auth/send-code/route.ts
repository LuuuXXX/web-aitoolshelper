import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateCode, isEmail, isPhone } from '@/lib/utils'
import { sendVerificationCode } from '@/lib/email'
import { sendSms } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { target, type = 'register' } = body

    if (!target) {
      return NextResponse.json({ error: '请输入邮箱或手机号' }, { status: 400 })
    }

    const isMail = isEmail(target)
    const isMobile = isPhone(target)

    if (!isMail && !isMobile) {
      return NextResponse.json({ error: '请输入有效的邮箱或手机号' }, { status: 400 })
    }

    // 频率限制：同一 target 60秒内只能发一次
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

    let sent = false
    if (isMail) {
      sent = await sendVerificationCode(target, code, type)
    } else {
      sent = await sendSms(target, code)
    }

    // 开发环境下始终返回验证码（生产环境删除此行）
    if (process.env.NODE_ENV === 'development' || !sent) {
      return NextResponse.json({
        success: true,
        message: sent ? '验证码已发送' : '通知服务未配置，请使用开发验证码',
        devCode: process.env.NODE_ENV === 'development' ? code : undefined,
      })
    }

    return NextResponse.json({ success: true, message: '验证码已发送' })
  } catch (err) {
    console.error('Send code error:', err)
    return NextResponse.json({ error: '发送失败，请稍后重试' }, { status: 500 })
  }
}
