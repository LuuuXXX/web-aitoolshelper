import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { TOOLS, CATEGORIES } from '@/config/tools'
import { PLANS, FREE_PLAN } from '@/config/pricing'
import Icon from '@/components/Icon'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-500 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 card text-sm" style={{ color: 'var(--muted)' }}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {TOOLS.length}+ 款AI工具，持续更新中
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              让 <span className="gradient-text">AI</span> 为你的<br className="hidden md:block" />工作和创作赋能
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--muted)' }}>
              集合 {TOOLS.length}+ 款开箱即用的 AI 应用工具，涵盖写作、营销、办公、创意等场景。
              无需复杂操作，一键生成专业内容。
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/register" className="btn-primary text-base px-8 py-3">
                免费开始使用
              </Link>
              <Link href="/#tools" className="px-8 py-3 rounded-lg border text-base transition-colors hover:border-brand-500"
                style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}>
                浏览工具库
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: 'var(--muted)' }}>
              <span>✓ 每日免费体验</span>
              <span>✓ 无需安装</span>
              <span>✓ 数据安全加密</span>
            </div>
          </div>
        </section>

        {/* Tools */}
        <section id="tools" className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">工具库</h2>
              <p style={{ color: 'var(--muted)' }}>选择你需要的AI工具，即刻开始</p>
            </div>

            {CATEGORIES.map((category) => {
              const tools = TOOLS.filter((t) => t.category === category.id)
              if (tools.length === 0) return null
              return (
                <div key={category.id} className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white">
                      <Icon name={category.icon} className="w-4 h-4" />
                    </div>
                    <h3 className="text-xl font-bold">{category.name}</h3>
                    <span className="text-sm" style={{ color: 'var(--muted)' }}>{tools.length} 款工具</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={`/dashboard/tools/${tool.id}`}
                        className="card p-5 hover:border-brand-500 transition-all hover:shadow-lg group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-brand-500"
                            style={{ background: 'var(--color-brand-50)' }}>
                            <Icon name={tool.icon} className="w-5 h-5" />
                          </div>
                          {tool.badge && (
                            <span className="px-2 py-0.5 text-xs rounded-full gradient-bg text-white">
                              {tool.badge}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold mb-1 group-hover:text-brand-500 transition-colors">{tool.name}</h4>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>{tool.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 md:py-24" style={{ background: 'var(--card-bg)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">简单透明的定价</h2>
              <p style={{ color: 'var(--muted)' }}>选择适合你的方案，随时可取消</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
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
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span style={{ color: 'var(--foreground)' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block text-center py-2.5 rounded-lg border transition-colors hover:border-brand-500"
                  style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}>
                  开始使用
                </Link>
              </div>

              {/* Paid plans */}
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`card p-6 flex flex-col relative ${
                    plan.popular ? 'border-2 border-brand-500' : ''
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs rounded-full gradient-bg text-white">
                      最受欢迎
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
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span style={{ color: 'var(--foreground)' }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/pricing?plan=${plan.id}`} className={`block text-center py-2.5 rounded-lg transition-colors ${
                    plan.popular ? 'btn-primary' : 'border hover:border-brand-500'
                  }`} style={!plan.popular ? { borderColor: 'var(--card-border)', color: 'var(--foreground)' } : {}}>
                    选择{plan.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
            <p className="text-lg mb-8" style={{ color: 'var(--muted)' }}>
              立即注册，免费体验 AI 工具箱的强大功能
            </p>
            <Link href="/register" className="btn-primary text-base px-8 py-3 inline-block">
              免费注册
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
