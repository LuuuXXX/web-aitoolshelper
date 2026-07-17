import { describe, it, expect, vi } from 'vitest'
import { resetCookies, lastSetCall } from './helpers/cookie-store'

describe('SESSION_MAX_AGE consistency (cookie expires == JWT exp)', () => {
  it('SESSION_MAX_AGE=1d keeps cookie and JWT expiry within 1s', async () => {
    process.env.SESSION_MAX_AGE = '1d'
    vi.resetModules()
    const { createSession, SESSION_MAX_AGE_MS } = await import('@/lib/session')
    expect(SESSION_MAX_AGE_MS).toBe(86_400_000)

    resetCookies()
    await createSession('user-1', 'user', 0)

    const call = lastSetCall()
    expect(call?.name).toBe('session')
    const jwt = call!.value
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString())
    const jwtExp = payload.exp as number
    const cookieExpires = (call!.opts as { expires: Date }).expires.getTime() / 1000
    expect(Math.abs(jwtExp - cookieExpires)).toBeLessThan(1)
  })
})
