import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isEmail } from '@/lib/utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limited = rateLimit(`reset:${ip}`, 5, 60_000)
    if (!limited.allowed) {
      return NextResponse.json(
        { error: '操作过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { account, code, newPassword } = body

    if (!account || !code || !newPassword) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 })
    }

    if (newPassword.length > 128) {
      return NextResponse.json({ error: '密码过长' }, { status: 400 })
    }

    if (!isEmail(account)) {
      return NextResponse.json({ error: '请输入有效的邮箱' }, { status: 400 })
    }

    const attemptLimited = rateLimit(`verify:${account}`, 5, 300_000)
    if (!attemptLimited.allowed) {
      return NextResponse.json({ error: '验证尝试次数过多，请5分钟后再试' }, { status: 429 })
    }

    const record = await prisma.verificationCode.findFirst({
      where: {
        target: account,
        code,
        type: 'reset',
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
      return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: account },
    })

    if (!user) {
      return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    try {
      await prisma.$transaction(async (tx) => {
        const consumed = await tx.verificationCode.updateMany({
          where: { id: record.id, used: false },
          data: { used: true },
        })
        if (consumed.count === 0) throw new Error('code_already_used')

        await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            tokenVersion: { increment: 1 },
          },
        })
      })
    } catch {
      return NextResponse.json({ error: '验证码无效或已使用' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: '密码重置成功' })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: '重置失败，请稍后重试' }, { status: 500 })
  }
}
