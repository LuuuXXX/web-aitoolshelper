import { describe, it, expect, afterAll, vi } from 'vitest'

describe('JWT_SECRET strength check', () => {
  const original = process.env.JWT_SECRET

  afterAll(() => {
    process.env.JWT_SECRET = original
    vi.resetModules()
  })

  it('throws on import when JWT_SECRET < 32 bytes', async () => {
    process.env.JWT_SECRET = 'too-short'
    vi.resetModules()
    await expect(import('@/lib/session')).rejects.toThrow(/JWT_SECRET/i)
  })
})
