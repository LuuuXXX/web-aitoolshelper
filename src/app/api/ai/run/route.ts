import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession, isPremiumUser } from '@/lib/dal'
import { chatCompletion } from '@/lib/deepseek'
import { getToolById } from '@/config/tools'
import { getDailyLimitByPlan, FREE_PLAN } from '@/config/pricing'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { parseBody, aiRunSchema, csrfOk, csrfDenied } from '@/lib/validation'
import { logError } from '@/lib/logger'

const MAX_INPUT_LENGTH = 8000

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

    if (!csrfOk(request)) return csrfDenied()

    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await parseBody(aiRunSchema, request)
    if (!body.ok) return body.response
    const { toolId, input: rawInput } = body.data

    const tool = getToolById(toolId)
    if (!tool) {
      return NextResponse.json({ error: '工具不存在' }, { status: 404 })
    }

    const userInput = rawInput && typeof rawInput === 'object' && !Array.isArray(rawInput) ? rawInput as Record<string, unknown> : {}

    for (const field of tool.fields) {
      const val = userInput[field.key]
      if (field.required && (!val || !String(val).trim())) {
        return NextResponse.json({ error: `请填写${field.label}` }, { status: 400 })
      }
      if (typeof val === 'string' && val.length > MAX_INPUT_LENGTH) {
        return NextResponse.json({ error: `${field.label}内容过长，请精简后重试` }, { status: 400 })
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

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

    const isNewDay = !user.lastUseDate || user.lastUseDate < today

    if (isNewDay) {
      await prisma.user.updateMany({
        where: { id: user.id, OR: [{ lastUseDate: { lt: today } }, { lastUseDate: null }] },
        data: { usedToday: 0, lastUseDate: today },
      })
    }

    const updated = await prisma.user.updateMany({
      where: { id: user.id, usedToday: { lt: effectiveLimit } },
      data: { usedToday: { increment: 1 } },
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: '今日使用次数已达上限，升级会员可获得更多次数', needUpgrade: true },
        { status: 403 }
      )
    }

    const inputForPrompt = userInput as Record<string, string>
    const messages = [
      { role: 'system' as const, content: tool.systemPrompt(inputForPrompt) },
      { role: 'user' as const, content: tool.userPrompt(inputForPrompt) },
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
    } catch (err) {
      logError('ai/run', { userId: user.id, toolId }, err)
      await prisma.user.updateMany({
        where: { id: user.id, usedToday: { gt: 0 } },
        data: { usedToday: { decrement: 1 } },
      })
      return NextResponse.json(
        { error: 'AI 服务暂时不可用，请稍后重试' },
        { status: 502 }
      )
    }

    const record = await prisma.toolRecord.create({
      data: {
        userId: user.id,
        toolId,
        input: JSON.stringify(userInput),
        output,
        tokensUsed,
      },
    })

    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { usedToday: true, lastUseDate: true },
    })
    const currentUsed = (!freshUser?.lastUseDate || freshUser.lastUseDate < today)
      ? 1
      : freshUser.usedToday

    return NextResponse.json({
      success: true,
      output,
      recordId: record.id,
      remaining: Math.max(effectiveLimit - currentUsed, 0),
    })
  } catch (err) {
    logError('ai/run', {}, err)
    return NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 })
  }
}
