import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetCookies } from './helpers/cookie-store'
import { buildRequest, authenticateAs, json } from './helpers/http'

const holder = vi.hoisted<Record<string, unknown>>(() => ({}))

vi.mock('react', async (importOriginal) => {
  const m = await importOriginal<typeof import('react')>()
  return { ...m, cache: <T>(fn: () => T) => fn }
})

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({ allowed: true }),
  getClientIp: () => '127.0.0.1',
}))

const chatMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/deepseek', () => ({
  chatCompletion: chatMock,
}))

vi.mock('@/lib/db', async () => {
  const { createMockPrisma } = await import('./helpers/db-mock')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  holder.prisma = createMockPrisma({
    users: [
      {
        id: 'u-ai',
        email: 'ai@test.com',
        name: 'AI User',
        role: 'user',
        tokenVersion: 0,
        passwordHash: 'x',
        plan: 'free',
        planExpire: null,
        dailyLimit: 5,
        usedToday: 3,
        lastUseDate: today,
        avatar: null,
        createdAt: new Date(),
      },
    ],
    toolRecords: [],
  })
  return { prisma: holder.prisma }
})

beforeEach(() => {
  resetCookies()
  process.env.APP_URL = 'http://localhost:3000'
  chatMock.mockResolvedValue({ content: 'AI result text', tokensUsed: 42 })
})

const validInput = { toolId: 'article-writer', input: { topic: 'AI教育', style: '通俗易懂', length: '800' } }

describe('6.7 AI run + quota', () => {
  it('authenticated run returns output and decrements remaining quota', async () => {
    await authenticateAs('u-ai', 'user', 0)
    const { POST } = await import('@/app/api/ai/run/route')
    const res = await POST(buildRequest({ path: '/api/ai/run', body: validInput }))
    expect(res.status).toBe(200)
    const body = await json(res) as { success: boolean; output: string; remaining: number }
    expect(body.success).toBe(true)
    expect(body.output).toBe('AI result text')
    expect(body.remaining).toBe(1)

    const prisma = holder.prisma as { __tables: { users: Array<Record<string, unknown>> } }
    const user = prisma.__tables.users.find((u) => u.id === 'u-ai')!
    expect(user.usedToday).toBe(4)
  })

  it('records the AI output in toolRecords', async () => {
    await authenticateAs('u-ai', 'user', 0)
    const { POST } = await import('@/app/api/ai/run/route')
    await POST(buildRequest({ path: '/api/ai/run', body: validInput }))
    const prisma = holder.prisma as { __tables: { toolRecords: Array<Record<string, unknown>> } }
    const records = prisma.__tables.toolRecords.filter((r) => r.userId === 'u-ai')
    expect(records.length).toBeGreaterThan(0)
    expect(records[records.length - 1].output).toBe('AI result text')
  })

  it('returns 401 when not authenticated', async () => {
    const { POST } = await import('@/app/api/ai/run/route')
    const res = await POST(buildRequest({ path: '/api/ai/run', body: validInput }))
    expect(res.status).toBe(401)
  })

  it('returns 403 needUpgrade when daily quota exhausted', async () => {
    const prisma = holder.prisma as { __tables: { users: Array<Record<string, unknown>> } }
    prisma.__tables.users[0].usedToday = 5
    await authenticateAs('u-ai', 'user', 0)
    const { POST } = await import('@/app/api/ai/run/route')
    const res = await POST(buildRequest({ path: '/api/ai/run', body: validInput }))
    expect(res.status).toBe(403)
    const body = await json(res) as { needUpgrade: boolean }
    expect(body.needUpgrade).toBe(true)
  })

  it('returns 400 when required field is missing', async () => {
    await authenticateAs('u-ai', 'user', 0)
    const { POST } = await import('@/app/api/ai/run/route')
    const res = await POST(buildRequest({
      path: '/api/ai/run',
      body: { toolId: 'article-writer', input: { topic: '', style: '通俗易懂', length: '800' } },
    }))
    expect(res.status).toBe(400)
  })

  it('returns 404 for unknown tool', async () => {
    await authenticateAs('u-ai', 'user', 0)
    const { POST } = await import('@/app/api/ai/run/route')
    const res = await POST(buildRequest({
      path: '/api/ai/run',
      body: { toolId: 'nonexistent-tool', input: { topic: 'x' } },
    }))
    expect(res.status).toBe(404)
  })

  it('refunds quota when DeepSeek fails (502 + usedToday unchanged)', async () => {
    const prisma = holder.prisma as { __tables: { users: Array<Record<string, unknown>> } }
    prisma.__tables.users[0].usedToday = 3
    chatMock.mockRejectedValueOnce(new Error('deepseek down'))
    await authenticateAs('u-ai', 'user', 0)
    const { POST } = await import('@/app/api/ai/run/route')
    const res = await POST(buildRequest({ path: '/api/ai/run', body: validInput }))
    expect(res.status).toBe(502)
    const user = prisma.__tables.users.find((u) => u.id === 'u-ai')!
    expect(user.usedToday).toBe(3)
  })
})
