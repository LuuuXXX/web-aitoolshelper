import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetCookies, setCookieValue } from './helpers/cookie-store'

const holder = vi.hoisted<Record<string, unknown>>(() => ({}))

vi.mock('react', async (importOriginal) => {
  const m = await importOriginal<typeof import('react')>()
  return { ...m, cache: <T>(fn: () => T) => fn }
})

vi.mock('@/lib/db', async () => {
  const { createMockPrisma } = await import('./helpers/db-mock')
  const yesterday = new Date(Date.now() - 86_400_000)
  holder.prisma = createMockPrisma({
    users: [
      {
        id: 'u1',
        email: 'a@b.com',
        name: 'Alice',
        role: 'user',
        tokenVersion: 0,
        plan: 'free',
        planExpire: null,
        dailyLimit: 3,
        usedToday: 5,
        lastUseDate: yesterday,
        avatar: null,
        createdAt: new Date(),
      },
    ],
  })
  return { prisma: holder.prisma }
})

async function setSessionCookie(userId: string, role: string, tokenVersion: number) {
  const { encrypt } = await import('@/lib/session')
  const jwt = await encrypt({ userId, role, tokenVersion })
  setCookieValue('session', jwt)
}

describe('getCurrentUser quota reset persistence', () => {
  beforeEach(() => {
    resetCookies()
  })

  it('resets usedToday=0 and persists to DB when lastUseDate < today', async () => {
    const { getCurrentUser } = await import('@/lib/dal')
    await setSessionCookie('u1', 'user', 0)

    const user = await getCurrentUser()
    expect(user).not.toBeNull()
    expect(user!.usedToday).toBe(0)

    const prisma = holder.prisma as { __tables: { users: Array<Record<string, unknown>> } }
    const dbRow = prisma.__tables.users.find((u) => u.id === 'u1')!
    expect(dbRow.usedToday).toBe(0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expect(new Date(dbRow.lastUseDate as string).getTime()).toBe(today.getTime())
  })

  it('does NOT reset when lastUseDate is already today', async () => {
    const prisma = holder.prisma as { __tables: { users: Array<Record<string, unknown>> } }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    prisma.__tables.users[0].lastUseDate = today
    prisma.__tables.users[0].usedToday = 2

    const { getCurrentUser } = await import('@/lib/dal')
    await setSessionCookie('u1', 'user', 0)

    const user = await getCurrentUser()
    expect(user!.usedToday).toBe(2)
    expect(dbRowStillUsed(prisma)).toBe(2)
  })

  function dbRowStillUsed(p: {
    __tables: { users: Array<Record<string, unknown>> }
  }): number {
    return p.__tables.users.find((u) => u.id === 'u1')!.usedToday as number
  }
})
