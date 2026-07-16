import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { deleteSession } from '@/lib/session'

export async function POST() {
  const session = await verifySession()
  if (session) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { tokenVersion: { increment: 1 } },
    })
  }
  await deleteSession()
  return NextResponse.json({ success: true })
}
