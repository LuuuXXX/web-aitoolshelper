import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { deleteSession } from '@/lib/session'

export async function POST() {
  try {
    const session = await verifySession()
    if (session) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { tokenVersion: { increment: 1 } },
      }).catch(() => {})
    }
    await deleteSession()
    return NextResponse.json({ success: true })
  } catch {
    await deleteSession().catch(() => {})
    return NextResponse.json({ success: true })
  }
}
