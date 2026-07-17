'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { PLANS, FREE_PLAN } from '@/config/pricing'
import * as Icons from 'lucide-react'

function PricingContent() {
  const searchParams = useSearchParams()
  const selectedPlan = searchParams.get('plan')
  const [user, setUser] = useState<{ plan?: string } | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/user')
      .then((r) => {
        if (r.status === 401) return null
        return r.json()
      })
      .then((data) => {
        if (data?.user) setUser(data.user)
      })
      .catch(() => {})
  }, [])

  async function handleSubscribe(planId: string) {
    setError('')
    if (!user) {
      window.location.assign('/auth?mode=login&redirect=/pricing')
      return
    }

    setLoading(planId)
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '创建订单失败')
        return
      }
      // Redirect to Alipay payment page
      window.location.assign(data.paymentUrl)
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="pt-16">
      <div className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">选择适合你的方案</h1>
            <p style={{ color: 'var(--muted)' }}>低至 ¥0.46/天，畅享全部 AI 工具</p>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-6 px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm text-center dark:bg-red-900/20">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Free */}
            <div className="card p-6 flex flex-col">
              <h3 className="text-lg font-bold mb-1">{FREE_PLAN.name}</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>免费体验</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">¥0</span>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>/永久</span>
              </div>
              <ul className="space-y-2 text-sm mb-6 flex-1">
                {FREE_PLAN.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Icons.Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {user ? (
                <div className="text-center py-2.5 rounded-lg border text-sm" style={{ borderColor: 'var(--card-border)', color: 'var(--muted)' }}>
                  当前方案
                </div>
              ) : (
                <Link href="/auth?mode=register" className="block text-center py-2.5 rounded-lg border text-sm transition-colors hover:border-brand-500"
                  style={{ borderColor: 'var(--card-border)' }}>
                  注册
                </Link>
              )}
            </div>

            {/* Paid plans */}
            {PLANS.map((plan) => {
              const isCurrent = user?.plan === plan.id
              return (
                <div
                  key={plan.id}
                  className={`card p-6 flex flex-col relative ${plan.popular ? 'border-2 border-brand-500' : ''}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs rounded-full gradient-bg text-white">
                      最受欢迎
                    </span>
                  )}
                  {selectedPlan === plan.id && (
                    <span className="absolute -top-3 right-3 px-2 py-0.5 text-xs rounded-full bg-green-500 text-white">
                      已选择
                    </span>
                  )}
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>{plan.duration}</p>
                  <div className="mb-1">
                    <span className="text-3xl font-bold">¥{plan.price}</span>
                    <span className="text-sm" style={{ color: 'var(--muted)' }}>/{plan.duration}</span>
                  </div>
                  {plan.originalPrice && (
                    <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
                      <span className="line-through">¥{plan.originalPrice}</span>
                    </p>
                  )}
                  <ul className="space-y-2 text-sm mb-6 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Icons.Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="text-center py-2.5 rounded-lg border text-sm" style={{ borderColor: 'var(--card-border)', color: 'var(--muted)' }}>
                      当前方案
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loading === plan.id}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        plan.popular ? 'btn-primary' : 'border hover:border-brand-500'
                      }`}
                      style={!plan.popular ? { borderColor: 'var(--card-border)', color: 'var(--foreground)' } : {}}
                    >
                      {loading === plan.id ? (
                        <>
                          <Icons.Loader2 className="w-4 h-4 animate-spin" />
                          跳转支付...
                        </>
                      ) : (
                        <>
                          <Icons.CreditCard className="w-4 h-4" />
                          支付宝支付
                        </>
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
            <p>支付即表示同意 <Link href="/terms" className="text-brand-500 hover:underline">服务条款</Link></p>
            <p className="mt-2">支持支付宝支付 · 有效期满自动恢复免费方案 · 如需退款请联系客服</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="pt-20 text-center"><Icons.Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" /></div>}>
          <PricingContent />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
