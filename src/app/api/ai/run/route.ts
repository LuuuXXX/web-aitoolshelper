import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { chatCompletion } from '@/lib/deepseek'
import { getToolById } from '@/config/tools'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const ipLimited = rateLimit(`airun:${ip}`, 20, 60_000)
    if (!ipLimited.allowed) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { toolId, input } = body

    const tool = getToolById(toolId)
    if (!tool) {
      return NextResponse.json({ error: '工具不存在' }, { status: 404 })
    }

    // 获取用户并检查配额
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 重置每日使用次数
    if (!user.lastUseDate || user.lastUseDate < today) {
      await prisma.user.update({
        where: { id: user.id },
        data: { usedToday: 0, lastUseDate: today },
      })
      user.usedToday = 0
    }

    if (user.usedToday >= user.dailyLimit) {
      return NextResponse.json(
        { error: '今日使用次数已达上限，升级会员可获得更多次数', needUpgrade: true },
        { status: 403 }
      )
    }

    // 验证必填字段
    for (const field of tool.fields) {
      if (field.required && !input[field.key]?.trim()) {
        return NextResponse.json({ error: `请填写${field.label}` }, { status: 400 })
      }
    }

    // 调用 AI
    const messages = [
      { role: 'system' as const, content: tool.systemPrompt(input) },
      { role: 'user' as const, content: tool.userPrompt(input) },
    ]

    const { content: output, tokensUsed } = await chatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 4096,
    })

    // 更新使用次数
    await prisma.user.update({
      where: { id: user.id },
      data: { usedToday: { increment: 1 } },
    })

    // 保存记录
    const record = await prisma.toolRecord.create({
      data: {
        userId: user.id,
        toolId,
        input: JSON.stringify(input),
        output,
        tokensUsed,
      },
    })

    return NextResponse.json({
      success: true,
      output,
      recordId: record.id,
      remaining: user.dailyLimit - user.usedToday - 1,
    })
  } catch (err) {
    console.error('AI tool error:', err)
    const message = err instanceof Error ? err.message : '处理失败，请稍后重试'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
