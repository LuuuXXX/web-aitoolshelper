import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  parseBody,
  loginSchema,
  registerSchema,
  sendCodeSchema,
  aiRunSchema,
  paymentCreateSchema,
  userUpdateSchema,
  resetPasswordSchema,
  csrfOk,
} from '@/lib/validation'
import { escapeHtml } from '@/lib/email'

describe('validation schemas', () => {
  it('loginSchema requires valid email + non-empty password', () => {
    expect(loginSchema.safeParse({ account: 'a@b.com', password: '123456' }).success).toBe(true)
    expect(loginSchema.safeParse({ account: 'bad', password: '123456' }).success).toBe(false)
    expect(loginSchema.safeParse({ account: 'a@b.com', password: '' }).success).toBe(false)
  })

  it('registerSchema validates email, password>=8, code', () => {
    expect(registerSchema.safeParse({ account: 'a@b.com', password: 'Abcd1234', code: '123456' }).success).toBe(true)
    expect(registerSchema.safeParse({ account: 'a@b.com', password: 'short', code: '123456' }).success).toBe(false)
    expect(registerSchema.safeParse({ account: 'a@b.com', password: 'Abcd1234' }).success).toBe(false)
  })

  it('sendCodeSchema accepts email target + type', () => {
    expect(sendCodeSchema.safeParse({ target: 'a@b.com', type: 'register' }).success).toBe(true)
    expect(sendCodeSchema.safeParse({ target: 'a@b.com', type: 'reset' }).success).toBe(true)
    expect(sendCodeSchema.safeParse({ target: 'a@b.com' }).success).toBe(true)
    expect(sendCodeSchema.safeParse({ target: 'bad', type: 'register' }).success).toBe(false)
  })

  it('aiRunSchema validates toolId + optional input', () => {
    expect(aiRunSchema.safeParse({ toolId: 'summarize', input: { q: 'hi' } }).success).toBe(true)
    expect(aiRunSchema.safeParse({ toolId: 'summarize' }).success).toBe(true)
    expect(aiRunSchema.safeParse({ toolId: '' }).success).toBe(false)
  })

  it('paymentCreateSchema requires planId', () => {
    expect(paymentCreateSchema.safeParse({ planId: 'pro' }).success).toBe(true)
    expect(paymentCreateSchema.safeParse({ planId: '' }).success).toBe(false)
    expect(paymentCreateSchema.safeParse({ plan: 'pro' }).success).toBe(false)
  })

  it('userUpdateSchema validates name length', () => {
    expect(userUpdateSchema.safeParse({ name: 'Alice' }).success).toBe(true)
    expect(userUpdateSchema.safeParse({ name: '' }).success).toBe(false)
  })

  it('resetPasswordSchema validates newPassword>=8', () => {
    expect(resetPasswordSchema.safeParse({ account: 'a@b.com', code: '1', newPassword: 'Abcd1234' }).success).toBe(true)
    expect(resetPasswordSchema.safeParse({ account: 'a@b.com', code: '1', newPassword: 'short' }).success).toBe(false)
  })
})

describe('parseBody', () => {
  it('returns ok with parsed data on valid JSON matching schema', async () => {
    const req = new Request('http://x', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ account: 'a@b.com', password: '123456' }),
    })
    const res = await parseBody(loginSchema, req)
    expect(res.ok).toBe(true)
  })

  it('returns ok=false on invalid JSON', async () => {
    const req = new Request('http://x', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{bad',
    })
    const res = await parseBody(loginSchema, req)
    expect(res.ok).toBe(false)
  })

  it('returns ok=false on schema failure', async () => {
    const req = new Request('http://x', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ account: 'nope', password: '' }),
    })
    const res = await parseBody(loginSchema, req)
    expect(res.ok).toBe(false)
  })
})

describe('csrfOk', () => {
  const origAppUrl = process.env.APP_URL
  beforeEach(() => {
    process.env.APP_URL = 'http://localhost:3000'
  })
  afterEach(() => {
    process.env.APP_URL = origAppUrl
  })

  it('accepts same-origin sec-fetch-site', () => {
    const r = new Request('http://localhost:3000', { headers: { 'sec-fetch-site': 'same-origin' } })
    expect(csrfOk(r)).toBe(true)
  })

  it('accepts matching Origin header', () => {
    const r = new Request('http://localhost:3000', { headers: { origin: 'http://localhost:3000' } })
    expect(csrfOk(r)).toBe(true)
  })

  it('rejects cross-origin without same-origin site', () => {
    const r = new Request('http://localhost:3000', { headers: { origin: 'https://evil.com' } })
    expect(csrfOk(r)).toBe(false)
  })

  it('rejects when no sec-fetch-site and no origin', () => {
    const r = new Request('http://localhost:3000')
    expect(csrfOk(r)).toBe(false)
  })
})

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
    expect(escapeHtml('"x"&y')).toBe('&quot;x&quot;&amp;y')
    expect(escapeHtml("a'b")).toBe("a&#39;b")
  })

  it('does not alter plain alphanumeric codes', () => {
    expect(escapeHtml('123456')).toBe('123456')
  })
})
