import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession, isPremiumUser } from '@/lib/dal'
import { chatCompletion } from '@/lib/deepseek'
import { getToolById } from '@/config/tools'
import { getDailyLimitByPlan, FREE_PLAN } from '@/config/pricing'
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

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isNewDay = !user.lastUseDate || user.lastUseDate < today

    const premium = isPremiumUser(user)
    const effectiveLimit = premium
      ? getDailyLimitByPlan(user.plan)
      : getDailyLimitByPlan('free')

    if (!premium && user.plan !== 'free') {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: 'free', dailyLimit: FREE_PLAN.dailyLimit },
      })
    }

    const updated = isNewDay
      ? await prisma.user.updateMany({
          where: { id: user.id },
          data: { usedToday: 1, lastUseDate: today },
        })
      : await prisma.user.updateMany({
          where: { id: user.id, usedToday: { lt: effectiveLimit } },
          data: { usedToday: { increment: 1 } },
        })

    if (!isNewDay && updated.count === 0) {
      return NextResponse.json(
        { error: '今日使用次数已达上限，升级会员可获得更多次数', needUpgrade: true },
        { status: 403 }
      )
    }

    for (const field of tool.fields) {
      if (field.required && !input[field.key]?.trim()) {
        await prisma.user.update({
          where: { id: user.id },
          data: { usedToday: { decrement: 1 } },
        })
        return NextResponse.json({ error: `请填写${field.label}` }, { status: 400 })
      }
    }

    const messages = [
      { role: 'system' as const, content: tool.systemPrompt(input) },
      { role: 'user' as const, content: tool.userPrompt(input) },
    ]

    let output: string
    let tokensUsed: number
    try {
      const result = await chatCompletion(messages, {
        temperature: 0.7,
        maxTokens: 4096,
      })
      output = result.content
      tokensUsed = result.tokensUsed
    } catch (aiErr) {
      await prisma.user.update({
        where: { id: user.id },
        data: { usedToday: { decrement: 1 } },
      })
      throw aiErr
    }

    const record = await prisma.toolRecord.create({
      data: {
        userId: user.id,
        toolId,
        input: JSON.stringify(input),
        output,
        tokensUsed,
      },
    })

    const currentUsed = isNewDay ? 1 : user.usedToday + 1

    return NextResponse.json({
      success: true,
      output,
      recordId: record.id,
      remaining: Math.max(effectiveLimit - currentUsed, 0),
    })
  } catch (err) {
    console.error('AI tool error:', err)
    const message = err instanceof Error ? err.message : '处理失败，请稍后重试'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
