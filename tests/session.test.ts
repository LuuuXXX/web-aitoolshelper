import { describe, it, expect, afterEach } from 'vitest'
import { resolveSecure } from '@/lib/session'

describe('resolveSecure', () => {
  const original = process.env.COOKIE_SECURE

  afterEach(() => {
    if (original === undefined) delete process.env.COOKIE_SECURE
    else process.env.COOKIE_SECURE = original
  })

  it('COOKIE_SECURE="false" → always false (overrides transport)', () => {
    process.env.COOKIE_SECURE = 'false'
    expect(resolveSecure({ proto: 'https:' })).toBe(false)
    expect(resolveSecure({ proto: 'http:', forwardedProto: 'https' })).toBe(false)
    expect(resolveSecure({ proto: 'http:' })).toBe(false)
  })

  it('COOKIE_SECURE="true" → always true (overrides transport)', () => {
    process.env.COOKIE_SECURE = 'true'
    expect(resolveSecure({ proto: 'http:' })).toBe(true)
    expect(resolveSecure({ proto: 'http:', forwardedProto: 'http' })).toBe(true)
  })

  it('no override + direct https → true', () => {
    delete process.env.COOKIE_SECURE
    expect(resolveSecure({ proto: 'https:' })).toBe(true)
  })

  it('no override + proxied https (x-forwarded-proto) → true', () => {
    delete process.env.COOKIE_SECURE
    expect(resolveSecure({ proto: 'http:', forwardedProto: 'https' })).toBe(true)
  })

  it('no override + plain http → false (fail-open so HTTP works)', () => {
    delete process.env.COOKIE_SECURE
    expect(resolveSecure({ proto: 'http:' })).toBe(false)
    expect(resolveSecure({ proto: 'http:', forwardedProto: 'http' })).toBe(false)
    expect(resolveSecure({ proto: 'http:', forwardedProto: undefined })).toBe(false)
  })

  it('no override + http with no forwardedProto field → false', () => {
    delete process.env.COOKIE_SECURE
    expect(resolveSecure({ proto: 'http:' })).toBe(false)
  })
})
