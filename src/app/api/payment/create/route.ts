import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { generateOrderNo } from '@/lib/utils'
import { createPayment, isAlipayConfigured } from '@/lib/alipay'
import { getPlanById } from '@/config/pricing'

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { planId } = body
    const plan = getPlanById(planId)

    if (!plan) {
      return NextResponse.json({ error: '无效的套餐' }, { status: 400 })
    }

    if (!isAlipayConfigured()) {
      return NextResponse.json({ error: '支付系统暂未配置，请联系管理员' }, { status: 503 })
    }

    const orderNo = generateOrderNo()
    const order = await prisma.order.create({
      data: {
        userId: session.userId,
        orderNo,
        plan: plan.id,
        amount: plan.price,
        status: 'pending',
        paymentMethod: 'alipay',
      },
    })

    const paymentUrl = await createPayment(
      orderNo,
      plan.price,
      plan.alipaySubject,
      `AI工具箱${plan.name}订阅`
    )

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNo,
      paymentUrl,
    })
  } catch (err) {
    console.error('Create order error:', err)
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 })
  }
}
