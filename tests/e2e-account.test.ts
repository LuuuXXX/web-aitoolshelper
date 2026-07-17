import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetCookies } from './helpers/cookie-store'
import { buildRequest, authenticateAs } from './helpers/http'

const holder = vi.hoisted<Record<string, unknown>>(() => ({}))

vi.mock('react', async (importOriginal) => {
  const m = await importOriginal<typeof import('react')>()
  return { ...m, cache: <T>(fn: () => T) => fn }
})

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({ allowed: true }),
  getClientIp: () => '127.0.0.1',
}))

vi.mock('@/lib/db', async () => {
  const { createMockPrisma } = await import('./helpers/db-mock')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  holder.prisma = createMockPrisma({
    users: [
      {
        id: 'u-owner',
        email: 'owner@test.com',
        phone: '13800000000',
        name: 'Owner',
        role: 'user',
        tokenVersion: 0,
        passwordHash: 'hash',
        plan: 'free',
        planExpire: null,
        dailyLimit: 5,
        usedToday: 1,
        lastUseDate: today,
        avatar: null,
        createdAt: new Date(),
        deletedAt: null,
      },
      {
        id: 'u-other',
        email: 'other@test.com',
        phone: '13900000000',
        name: 'Other',
        role: 'user',
        tokenVersion: 0,
        passwordHash: 'hash',
        plan: 'free',
        planExpire: null,
        dailyLimit: 5,
        usedToday: 0,
        lastUseDate: today,
        avatar: null,
        createdAt: new Date(),
        deletedAt: null,
      },
    ],
    toolRecords: [
      { id: 'rec-owner-1', userId: 'u-owner', toolId: 'article-writer', input: '{}', output: 'out1', tokensUsed: 10, createdAt: new Date(), status: 'completed' },
      { id: 'rec-other-1', userId: 'u-other', toolId: 'article-writer', input: '{}', output: 'out2', tokensUsed: 20, createdAt: new Date(), status: 'completed' },
    ],
    orders: [
      { id: 'ord-1', userId: 'u-owner', orderNo: 'NO1', plan: 'monthly', amount: 19.9, status: 'paid', paymentMethod: 'alipay', createdAt: new Date() },
    ],
  })
  return { prisma: holder.prisma }
})

beforeEach(() => {
  resetCookies()
  process.env.APP_URL = 'http://localhost:3000'
})

describe('6.8a AI history delete', () => {
  it('owner can delete own record → 200', async () => {
    await authenticateAs('u-owner', 'user', 0)
    const { DELETE } = await import('@/app/api/ai/history/[id]/route')
    const req = buildRequest({ method: 'DELETE', path: '/api/ai/history/rec-owner-1', body: undefined })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'rec-owner-1' }) })
    expect(res.status).toBe(200)
    const prisma = holder.prisma as { __tables: { toolRecords: Array<Record<string, unknown>> } }
    expect(prisma.__tables.toolRecords.find((r) => r.id === 'rec-owner-1')).toBeUndefined()
  })

  it('non-owner cannot delete another user\'s record → 404', async () => {
    await authenticateAs('u-owner', 'user', 0)
    const { DELETE } = await import('@/app/api/ai/history/[id]/route')
    const req = buildRequest({ method: 'DELETE', path: '/api/ai/history/rec-other-1', body: undefined })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'rec-other-1' }) })
    expect(res.status).toBe(404)
    const prisma = holder.prisma as { __tables: { toolRecords: Array<Record<string, unknown>> } }
    expect(prisma.__tables.toolRecords.find((r) => r.id === 'rec-other-1')).toBeTruthy()
  })

  it('unauthenticated → 401', async () => {
    const { DELETE } = await import('@/app/api/ai/history/[id]/route')
    const req = buildRequest({ method: 'DELETE', path: '/api/ai/history/rec-owner-1', body: undefined })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'rec-owner-1' }) })
    expect(res.status).toBe(401)
  })

  it('non-existent record → 404', async () => {
    await authenticateAs('u-owner', 'user', 0)
    const { DELETE } = await import('@/app/api/ai/history/[id]/route')
    const req = buildRequest({ method: 'DELETE', path: '/api/ai/history/nope', body: undefined })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nope' }) })
    expect(res.status).toBe(404)
  })
})

describe('6.8b account deletion (anonymization)', () => {
  it('anonymizes PII, increments tokenVersion, deletes toolRecords, keeps orders', async () => {
    await authenticateAs('u-owner', 'user', 0)
    const { POST } = await import('@/app/api/user/delete/route')
    const res = await POST(buildRequest({ path: '/api/user/delete', body: { confirm: true } }))
    expect(res.status).toBe(200)

    const prisma = holder.prisma as { __tables: { users: Array<Record<string, unknown>>; toolRecords: Array<Record<string, unknown>>; orders: Array<Record<string, unknown>> } }
    const user = prisma.__tables.users.find((u) => u.id === 'u-owner')!
    expect(user.email).toBeNull()
    expect(user.phone).toBeNull()
    expect(user.name).toBe('已注销用户')
    expect(user.avatar).toBeNull()
    expect(user.deletedAt).toBeTruthy()
    expect(user.tokenVersion).toBe(1)
    const remainingRecords = prisma.__tables.toolRecords.filter((r) => r.userId === 'u-owner')
    expect(remainingRecords.length).toBe(0)
    const remainingOrders = prisma.__tables.orders.filter((o) => o.userId === 'u-owner')
    expect(remainingOrders.length).toBe(1)
  })

  it('clears the session cookie after deletion', async () => {
    await authenticateAs('u-other', 'user', 0)
    const { POST } = await import('@/app/api/user/delete/route')
    await POST(buildRequest({ path: '/api/user/delete', body: { confirm: true } }))
    const { cookieStore } = await import('./helpers/cookie-store')
    expect(cookieStore().has('session')).toBe(false)
  })

  it('requires confirm:true', async () => {
    const prisma0 = holder.prisma as { __tables: { users: Array<Record<string, unknown>> } }
    const other = prisma0.__tables.users.find((u) => u.id === 'u-other')!
    other.tokenVersion = 0
    other.email = 'other@test.com'
    await authenticateAs('u-other', 'user', 0)
    const { POST } = await import('@/app/api/user/delete/route')
    const res = await POST(buildRequest({ path: '/api/user/delete', body: { confirm: false } }))
    expect(res.status).toBe(400)
  })

  it('unauthenticated → 401', async () => {
    const { POST } = await import('@/app/api/user/delete/route')
    const res = await POST(buildRequest({ path: '/api/user/delete', body: { confirm: true } }))
    expect(res.status).toBe(401)
  })
})
