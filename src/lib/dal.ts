import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from './session'
import { prisma } from './db'
import { getDailyLimitByPlan } from '@/config/pricing'

export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session?.userId) {
    return null
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, tokenVersion: true },
  })
  if (!user || user.tokenVersion !== (session.tokenVersion ?? 0)) {
    return null
  }
  return { isAuth: true, userId: session.userId, role: session.role ?? user.role }
})

export const requireAuth = cache(async () => {
  const session = await verifySession()
  if (!session) {
    redirect('/auth?mode=login')
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
      name: true,
      avatar: true,
      role: true,
      plan: true,
      planExpire: true,
      dailyLimit: true,
      usedToday: true,
      lastUseDate: true,
      tokenVersion: true,
      createdAt: true,
    },
  })

  if (user) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (!user.lastUseDate || user.lastUseDate < today) {
      return { ...user, usedToday: 0 }
    }
  }

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
  return getDailyLimitByPlan(plan)
}
