import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { deleteSession } from '@/lib/session'
import { csrfOk, csrfDenied } from '@/lib/validation'
import { logError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  if (!csrfOk(request)) return csrfDenied()
  const session = await verifySession()
  if (session) {
    try {
      await prisma.user.update({
        where: { id: session.userId },
        data: { tokenVersion: { increment: 1 } },
      })
    } catch (err) {
      logError('auth/logout', { userId: session.userId }, err)
    }
  }
  await deleteSession()
  return NextResponse.json({ success: true })
}
