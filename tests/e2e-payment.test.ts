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

const createPaymentMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/alipay', () => ({
  createPayment: createPaymentMock,
  isAlipayConfigured: () => true,
}))

vi.mock('@/lib/db', async () => {
  const { createMockPrisma } = await import('./helpers/db-mock')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  holder.prisma = createMockPrisma({
    users: [
      {
        id: 'u-pay',
        email: 'pay@test.com',
        name: 'Pay User',
        role: 'user',
        tokenVersion: 0,
        passwordHash: 'x',
        plan: 'free',
        planExpire: null,
        dailyLimit: 5,
        usedToday: 0,
        lastUseDate: today,
        avatar: null,
        createdAt: new Date(),
      },
    ],
    orders: [],
  })
  return { prisma: holder.prisma }
})

beforeEach(() => {
  resetCookies()
  process.env.APP_URL = 'http://localhost:3000'
  createPaymentMock.mockResolvedValue('https://openapi.alipay.com/pay/mock-url')
})

describe('6.9 payment create flow', () => {
  it('creates an order and returns paymentUrl for valid plan', async () => {
    await authenticateAs('u-pay', 'user', 0)
    const { POST } = await import('@/app/api/payment/create/route')
    const res = await POST(buildRequest({ path: '/api/payment/create', body: { planId: 'quarterly' } }))
    expect(res.status).toBe(200)
    const body = await json(res) as { success: boolean; orderId: string; orderNo: string; paymentUrl: string }
    expect(body.success).toBe(true)
    expect(body.orderNo).toBeTruthy()
    expect(body.paymentUrl).toContain('alipay')

    const prisma = holder.prisma as { __tables: { orders: Array<Record<string, unknown>> } }
    const order = prisma.__tables.orders[0]
    expect(order).toBeTruthy()
    expect(order.plan).toBe('quarterly')
    expect(order.amount).toBe(59)
    expect(order.status).toBe('pending')
    expect(order.userId).toBe('u-pay')
  })

  it('returns 401 when not authenticated', async () => {
    const { POST } = await import('@/app/api/payment/create/route')
    const res = await POST(buildRequest({ path: '/api/payment/create', body: { planId: 'monthly' } }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid planId', async () => {
    await authenticateAs('u-pay', 'user', 0)
    const { POST } = await import('@/app/api/payment/create/route')
    const res = await POST(buildRequest({ path: '/api/payment/create', body: { planId: 'nonexistent' } }))
    expect(res.status).toBe(400)
  })

  it('returns 503 when Alipay is not configured', async () => {
    vi.doUnmock('@/lib/alipay')
    vi.resetModules()
    vi.doMock('@/lib/alipay', () => ({
      createPayment: createPaymentMock,
      isAlipayConfigured: () => false,
    }))
    await authenticateAs('u-pay', 'user', 0)
    const { POST } = await import('@/app/api/payment/create/route')
    const res = await POST(buildRequest({ path: '/api/payment/create', body: { planId: 'monthly' } }))
    expect(res.status).toBe(503)
  })

  it('rejects without CSRF token', async () => {
    await authenticateAs('u-pay', 'user', 0)
    const { POST } = await import('@/app/api/payment/create/route')
    const res = await POST(buildRequest({ path: '/api/payment/create', body: { planId: 'monthly' }, csrf: false }))
    expect(res.status).toBe(403)
  })
})
