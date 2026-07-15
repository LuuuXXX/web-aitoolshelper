import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/session'
import { generateCode, isEmail, isPhone } from '@/lib/utils'
import { sendVerificationCode } from '@/lib/email'
import { sendSms } from '@/lib/sms'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { account, password, code, name } = body

    if (!account || !password) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 })
    }

    const email = isEmail(account) ? account : null
    const phone = isPhone(account) ? account : null

    if (!email && !phone) {
      return NextResponse.json({ error: '请输入有效的邮箱或手机号' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: email ? { email } : { phone },
    })

    if (existing) {
      return NextResponse.json({ error: '该账号已注册' }, { status: 409 })
    }

    // 验证码校验
    if (code) {
      const record = await prisma.verificationCode.findFirst({
        where: {
          target: account,
          code,
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
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        name: name || (email ? email.split('@')[0] : `用户${phone?.slice(-4) || ''}`),
      },
    })

    await createSession(user.id, user.role)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        plan: user.plan,
      },
    })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 })
  }
}
