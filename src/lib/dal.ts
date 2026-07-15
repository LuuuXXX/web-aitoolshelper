import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from './session'
import { prisma } from './db'

export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session?.userId) {
    return null
  }
  return { isAuth: true, userId: session.userId, role: session.role }
})

export const requireAuth = cache(async () => {
  const session = await verifySession()
  if (!session) {
    redirect('/login')
  }
  return session
})

export const getCurrentUser = cache(async () => {
  const session = await verifySession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      avatar: true,
      role: true,
      plan: true,
      planExpire: true,
      dailyLimit: true,
      usedToday: true,
      lastUseDate: true,
      createdAt: true,
    },
  })
  return user
})

export function isPremiumUser(user: {
  plan: string
  planExpire: Date | null
}): boolean {
  if (user.plan === 'free') return false
  if (!user.planExpire) return false
  return user.planExpire > new Date()
}

export function getDailyLimit(plan: string): number {
  switch (plan) {
    case 'monthly':
      return 100
    case 'quarterly':
      return 100
    case 'yearly':
      return 200
    default:
      return 10
  }
}
