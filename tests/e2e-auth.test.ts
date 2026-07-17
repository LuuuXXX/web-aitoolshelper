import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetCookies, lastSetCall } from './helpers/cookie-store'
import { buildRequest, json } from './helpers/http'

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
  const { hashPassword } = await import('@/lib/password')
  const passwordHash = await hashPassword('Test1234!')
  const yesterday = new Date(Date.now() - 86_400_000)
  holder.prisma = createMockPrisma({
    users: [
      {
        id: 'u-existing',
        email: 'existing@test.com',
        name: 'Existing',
        role: 'user',
        tokenVersion: 0,
        passwordHash,
        plan: 'free',
        planExpire: null,
        dailyLimit: 5,
        usedToday: 0,
        lastUseDate: yesterday,
        avatar: null,
        createdAt: new Date(),
      },
    ],
    verificationCodes: [
      {
        id: 'vc-register',
        target: 'new@test.com',
        code: '888888',
        type: 'register',
        used: false,
        expiresAt: new Date(Date.now() + 600_000),
        createdAt: new Date(),
      },
      {
        id: 'vc-existing',
        target: 'existing@test.com',
        code: '999999',
        type: 'register',
        used: false,
        expiresAt: new Date(Date.now() + 600_000),
        createdAt: new Date(),
      },
    ],
  })
  return { prisma: holder.prisma }
})

beforeEach(() => {
  resetCookies()
  process.env.APP_URL = 'http://localhost:3000'
})

describe('6.5 auth flow', () => {
  it('login with correct credentials creates session and returns user', async () => {
    const { POST } = await import('@/app/api/auth/login/route')
    const req = buildRequest({ path: '/api/auth/login', body: { account: 'existing@test.com', password: 'Test1234!' } })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await json(res) as { success: boolean; user: { email: string } }
    expect(body.success).toBe(true)
    expect(body.user.email).toBe('existing@test.com')
    const call = lastSetCall()
    expect(call?.name).toBe('session')
    expect(call?.value).toBeTruthy()
  })

  it('login with wrong password returns 401 with generic error', async () => {
    const { POST } = await import('@/app/api/auth/login/route')
    const req = buildRequest({ path: '/api/auth/login', body: { account: 'existing@test.com', password: 'WrongPass!' } })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await json(res) as { error: string }
    expect(body.error).toBe('账号或密码错误')
  })

  it('login with non-existent email returns 401 (no enumeration)', async () => {
    const { POST } = await import('@/app/api/auth/login/route')
    const req = buildRequest({ path: '/api/auth/login', body: { account: 'nobody@test.com', password: 'Test1234!' } })
    const res = await POST(req)
    expect(res.status).toBe(401)
    expect(lastSetCall()?.name).not.toBe('session')
  })

  it('register with valid code creates user and session', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = buildRequest({
      path: '/api/auth/register',
      body: { account: 'new@test.com', password: 'NewPass123!', code: '888888' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await json(res) as { success: boolean; user: { email: string } }
    expect(body.success).toBe(true)
    expect(body.user.email).toBe('new@test.com')
    const prisma = holder.prisma as { __tables: { users: Array<Record<string, unknown>> } }
    const created = prisma.__tables.users.find((u) => u.email === 'new@test.com')
    expect(created).toBeTruthy()
  })

  it('register consumes the verification code', async () => {
    const prisma = holder.prisma as { __tables: { users: Array<Record<string, unknown>>; verificationCodes: Array<Record<string, unknown>> } }
    const usersTbl = prisma.__tables.users
    const idx = usersTbl.findIndex((u) => u.email === 'new@test.com')
    if (idx !== -1) usersTbl.splice(idx, 1)
    const code = prisma.__tables.verificationCodes.find((c) => c.id === 'vc-register')!
    code.used = false
    const { POST } = await import('@/app/api/auth/register/route')
    const res = await POST(buildRequest({
      path: '/api/auth/register',
      body: { account: 'new@test.com', password: 'NewPass123!', code: '888888' },
    }))
    expect(res.status).toBe(200)
    expect(code.used).toBe(true)
  })
})

describe('6.6 CSRF protection', () => {
  it('rejects POST without sec-fetch-site or matching origin', async () => {
    const { POST } = await import('@/app/api/auth/login/route')
    const req = buildRequest({
      path: '/api/auth/login',
      body: { account: 'existing@test.com', password: 'Test1234!' },
      csrf: false,
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('rejects POST with cross-origin Origin header', async () => {
    const { POST } = await import('@/app/api/auth/login/route')
    const req = buildRequest({
      path: '/api/auth/login',
      body: { account: 'existing@test.com', password: 'Test1234!' },
      csrf: false,
      headers: { origin: 'https://evil.com' },
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('accepts POST with sec-fetch-site: same-origin', async () => {
    const { POST } = await import('@/app/api/auth/login/route')
    const req = buildRequest({
      path: '/api/auth/login',
      body: { account: 'existing@test.com', password: 'Test1234!' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})

describe('6.6 anti-enumeration on register', () => {
  it('register with bad code returns identical generic error', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = buildRequest({
      path: '/api/auth/register',
      body: { account: 'new@test.com', password: 'NewPass123!', code: '000000' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await json(res) as { error: string; status: number }
    expect(body.error).toBe('验证码无效或已过期')
    expect(body.status).toBe(400)
  })

  it('register with existing email returns the SAME error (no enumeration)', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = buildRequest({
      path: '/api/auth/register',
      body: { account: 'existing@test.com', password: 'NewPass123!', code: '999999' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await json(res) as { error: string; status: number }
    expect(body.error).toBe('验证码无效或已过期')
    expect(body.status).toBe(400)
  })
})
