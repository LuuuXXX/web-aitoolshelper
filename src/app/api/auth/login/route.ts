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
    const { account, password, code } = body

    if (!account || !password) {
      return NextResponse.json({ error: '请填写账号和密码' }, { status: 400 })
    }

    const where = isEmail(account)
      ? { email: account }
      : isPhone(account)
        ? { phone: account }
        : null

    if (!where) {
      return NextResponse.json({ error: '请输入有效的邮箱或手机号' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({ where })

    if (!user) {
      return NextResponse.json({ error: '账号不存在，请先注册' }, { status: 404 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 })
    }

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
    console.error('Login error:', err)
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 })
  }
}
