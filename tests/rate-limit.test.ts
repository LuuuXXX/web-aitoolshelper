import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getClientIp } from '@/lib/rate-limit'

function req(headers: Record<string, string>): Request {
  return new Request('http://localhost/test', { headers })
}

describe('getClientIp', () => {
  const original = process.env.TRUSTED_PROXY_HOPS

  afterAll(() => {
    if (original === undefined) delete process.env.TRUSTED_PROXY_HOPS
    else process.env.TRUSTED_PROXY_HOPS = original
  })

  it('takes the leftmost client IP for a single trusted proxy (default)', () => {
    delete process.env.TRUSTED_PROXY_HOPS
    const r = req({ 'x-forwarded-for': '1.1.1.1, 8.8.8.8' })
    expect(getClientIp(r)).toBe('1.1.1.1')
  })

  it('explicit hops=1 resolves the client behind one proxy', () => {
    process.env.TRUSTED_PROXY_HOPS = '1'
    const r = req({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' })
    expect(getClientIp(r)).toBe('203.0.113.5')
  })

  it('hops=2 skips two trusted proxies', () => {
    process.env.TRUSTED_PROXY_HOPS = '2'
    const r = req({ 'x-forwarded-for': '9.9.9.9, 10.0.0.2, 10.0.0.1' })
    expect(getClientIp(r)).toBe('9.9.9.9')
  })

  it('single XFF entry with hops=1 falls back to first entry', () => {
    process.env.TRUSTED_PROXY_HOPS = '1'
    const r = req({ 'x-forwarded-for': '5.5.5.5' })
    expect(getClientIp(r)).toBe('5.5.5.5')
  })

  it('no XFF falls back to x-real-ip', () => {
    process.env.TRUSTED_PROXY_HOPS = '1'
    const r = req({ 'x-real-ip': '7.7.7.7' })
    expect(getClientIp(r)).toBe('7.7.7.7')
  })

  it('no headers at all returns unknown', () => {
    process.env.TRUSTED_PROXY_HOPS = '1'
    expect(getClientIp(req({}))).toBe('unknown')
  })

  it('does NOT return the rightmost (proxy) IP — the original bug', () => {
    delete process.env.TRUSTED_PROXY_HOPS
    const r = req({ 'x-forwarded-for': '1.1.1.1, 8.8.8.8' })
    expect(getClientIp(r)).not.toBe('8.8.8.8')
  })
})

describe('getClientIp security', () => {
  beforeAll(() => {
    process.env.TRUSTED_PROXY_HOPS = '1'
  })
  afterAll(() => {
    delete process.env.TRUSTED_PROXY_HOPS
  })

  it('a spoofed trailing XFF entry does not override the real client', () => {
    const r = req({ 'x-forwarded-for': '198.51.100.2, attacker-spoof' })
    expect(getClientIp(r)).toBe('198.51.100.2')
  })
})
