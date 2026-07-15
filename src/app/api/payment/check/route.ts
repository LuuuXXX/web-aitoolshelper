import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { queryPayment } from '@/lib/alipay'
import { getPlanById } from '@/config/pricing'
import { getDailyLimit } from '@/lib/dal'

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
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

    // 主动查询支付宝
    try {
      const result = await queryPayment(order.tradeNo || '', orderNo)
      if (result && result.tradeStatus === 'TRADE_SUCCESS') {
        const plan = getPlanById(order.plan)
        if (plan) {
          const expireDate = new Date()
          expireDate.setDate(expireDate.getDate() + plan.durationDays)

          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: {
                status: 'paid',
                tradeNo: result.tradeNo,
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
        return NextResponse.json({ success: true, status: 'paid' })
      }
    } catch {
      // 查询失败时返回当前状态
    }

    return NextResponse.json({ success: true, status: order.status, order })
  } catch (err) {
    console.error('Check payment error:', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}
