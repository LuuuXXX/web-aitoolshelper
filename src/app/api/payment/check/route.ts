import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { queryPayment } from '@/lib/alipay'
import { getPlanById } from '@/config/pricing'
import { getDailyLimit } from '@/lib/dal'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { logError } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const ip = getClientIp(request)
    const limited = rateLimit(`paycheck:${ip}`, 10, 60_000)
    if (!limited.allowed) {
      return NextResponse.json({ error: '查询过于频繁，请稍后再试' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const orderNo = searchParams.get('orderNo')

    if (!orderNo) {
      return NextResponse.json({ error: '缺少订单号' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { orderNo },
    })

    if (!order || order.userId !== session.userId) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    if (order.status === 'paid') {
      return NextResponse.json({ success: true, status: 'paid', order })
    }

    try {
      const result = await queryPayment(order.tradeNo || '', orderNo)
      if (result && result.tradeStatus === 'TRADE_SUCCESS') {
        if (Math.abs(result.totalAmount - Number(order.amount)) > 0.01) {
          logError('payment/check', { orderNo, expected: order.amount, got: result.totalAmount }, new Error('amount_mismatch'))
          return NextResponse.json({ error: '支付金额异常' }, { status: 400 })
        }

        const plan = getPlanById(order.plan)
        if (plan) {
          await prisma.$transaction(async (tx) => {
            const updated = await tx.order.updateMany({
              where: { id: order.id, status: 'pending' },
              data: {
                status: 'paid',
                tradeNo: result.tradeNo,
                paidAt: new Date(),
              },
            })

            if (updated.count === 0) return

            const currentUser = await tx.user.findUnique({
              where: { id: order.userId },
              select: { planExpire: true },
            })

            const now = Date.now()
            const baseTime = currentUser?.planExpire && currentUser.planExpire.getTime() > now
              ? currentUser.planExpire.getTime()
              : now
            const expireDate = new Date(baseTime + plan.durationDays * 24 * 60 * 60 * 1000)

            await tx.user.update({
              where: { id: order.userId },
              data: {
                plan: plan.id,
                planExpire: expireDate,
                dailyLimit: getDailyLimit(plan.id),
              },
            })
          })
        }
        return NextResponse.json({ success: true, status: 'paid' })
      }
    } catch (err) {
      logError('payment/check', { orderNo }, err)
    }

    return NextResponse.json({ success: true, status: order.status, order })
  } catch (err) {
    logError('payment/check', {}, err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}
