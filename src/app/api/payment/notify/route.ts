import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyNotification } from '@/lib/alipay'
import { getPlanById } from '@/config/pricing'
import { getDailyLimit } from '@/lib/dal'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limited = rateLimit(`notify:${ip}`, 30, 60_000)
    if (!limited.allowed) {
      return NextResponse.json({ msg: 'fail' }, { status: 429 })
    }

    const formData = await request.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    const isValid = await verifyNotification(params)
    if (!isValid) {
      return NextResponse.json({ msg: 'fail' }, { status: 400 })
    }

    const tradeStatus = params.trade_status
    const outTradeNo = params.out_trade_no
    const tradeNo = params.trade_no

    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      const order = await prisma.order.findUnique({
        where: { orderNo: outTradeNo },
      })

      if (!order || order.status === 'paid') {
        return NextResponse.json({ msg: 'success' })
      }

      const paidAmount = parseFloat(params.total_amount || '0')
      if (Math.abs(paidAmount - Number(order.amount)) > 0.01) {
        console.error(`Payment amount mismatch: order ${outTradeNo} expected ${order.amount}, got ${paidAmount}`)
        return NextResponse.json({ msg: 'fail' }, { status: 400 })
      }

      const plan = getPlanById(order.plan)

      await prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id: order.id, status: 'pending' },
          data: {
            status: 'paid',
            tradeNo,
            paidAt: new Date(),
          },
        })

        if (updated.count === 0) return

        if (!plan) {
          console.error(`Plan not found for paid order ${outTradeNo}, plan=${order.plan}`)
          return
        }

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

    return NextResponse.json({ msg: 'success' })
  } catch (err) {
    console.error('Alipay notify error:', err)
    return NextResponse.json({ msg: 'fail' }, { status: 500 })
  }
}
