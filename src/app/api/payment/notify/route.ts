import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyNotification } from '@/lib/alipay'
import { getPlanById } from '@/config/pricing'
import { getDailyLimit } from '@/lib/dal'

export async function POST(request: NextRequest) {
  try {
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

      const plan = getPlanById(order.plan)
      if (!plan) {
        return NextResponse.json({ msg: 'success' })
      }

      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + plan.durationDays)

      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'paid',
            tradeNo,
            paidAt: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: order.userId },
          data: {
            plan: plan.id,
            planExpire: expireDate,
            dailyLimit: getDailyLimit(plan.id),
          },
        }),
      ])
    }

    return NextResponse.json({ msg: 'success' })
  } catch (err) {
    console.error('Alipay notify error:', err)
    return NextResponse.json({ msg: 'fail' }, { status: 500 })
  }
}
