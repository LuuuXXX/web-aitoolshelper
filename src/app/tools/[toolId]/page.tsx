import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Icon from '@/components/Icon'
import { TOOLS, CATEGORIES, getToolById } from '@/config/tools'
import { getToolMetadata, getToolJsonLd, getBreadcrumbJsonLd } from '@/lib/seo'
import { notFound } from 'next/navigation'
import { Check, ArrowRight, Sparkles } from 'lucide-react'

export async function generateStaticParams() {
  return TOOLS.map((tool) => ({ toolId: tool.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ toolId: string }>
}): Promise<Metadata> {
  const { toolId } = await params
  const tool = getToolById(toolId)
  if (!tool) return {}
  return getToolMetadata(tool)
}

export default async function ToolLandingPage({
  params,
}: {
  params: Promise<{ toolId: string }>
}) {
  const { toolId } = await params
  const tool = getToolById(toolId)
  if (!tool) notFound()

  const category = CATEGORIES.find((c) => c.id === tool.category)
  const relatedTools = TOOLS.filter(
    (t) => t.category === tool.category && t.id !== tool.id
  ).slice(0, 3)

  const jsonLd = getToolJsonLd(tool)
  const breadcrumbLd = getBreadcrumbJsonLd(tool)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--muted)' }}>
            <Link href="/" className="hover:text-brand-500">首页</Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-brand-500">工具库</Link>
            <span>/</span>
            <span style={{ color: 'var(--foreground)' }}>{tool.name}</span>
          </nav>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-brand-500 shrink-0"
              style={{ background: 'var(--color-brand-50)' }}>
              <Icon name={tool.icon} className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{tool.name}</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                {category?.name} · 免费在线使用
              </p>
            </div>
          </div>

          <p className="text-lg mb-8" style={{ color: 'var(--muted)' }}>
            {tool.description}
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <Link
              href={`/auth?mode=register&redirect=/dashboard/tools/${tool.id}`}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <Sparkles className="w-4 h-4" />
              免费使用 {tool.name}
            </Link>
            <Link
              href={`/dashboard/tools/${tool.id}`}
              className="px-6 py-3 rounded-lg border flex items-center gap-2 hover:border-brand-500 transition-colors"
              style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}
            >
              直接体验
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {tool.useCases && tool.useCases.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold mb-4">适用场景</h2>
              <div className="flex flex-wrap gap-2">
                {tool.useCases.map((useCase) => (
                  <span
                    key={useCase}
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{ background: 'var(--color-brand-50)', color: 'var(--color-brand-600)' }}
                  >
                    {useCase}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4">功能特点</h2>
            <ul className="space-y-3">
              {tool.fields.map((field) => (
                <li key={field.key} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{field.label}</p>
                    {field.placeholder && (
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>{field.placeholder}</p>
                    )}
                  </div>
                </li>
              ))}
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">AI 智能生成</p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>采用 DeepSeek V4 大模型，生成质量高、速度快</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">完全免费体验</p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>每日 5 次免费额度，注册即享</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4">使用方法</h2>
            <div className="space-y-4">
              {[
                { step: 1, title: '注册/登录账号', desc: '点击「免费使用」，用邮箱快速注册，30秒完成' },
                { step: 2, title: '填写必要信息', desc: `根据提示输入内容，${tool.fields.filter(f => f.required).map(f => f.label).join('、')}等` },
                { step: 3, title: '一键AI生成', desc: '点击生成按钮，AI将在数秒内为你创建专业内容' },
                { step: 4, title: '复制使用', desc: '生成结果可一键复制，直接用于你的工作和创作' },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4">常见问题</h2>
            <div className="space-y-4">
              {[
                {
                  q: `${tool.name}是免费的吗？`,
                  a: `${tool.name}提供每日免费使用额度，注册后即可免费体验。如需更多使用次数，可选择升级为月度、季度或年度会员。`,
                },
                {
                  q: `使用${tool.name}需要安装软件吗？`,
                  a: '不需要安装任何软件，AI工具箱所有工具均在线运行，打开网页即可使用，支持电脑和手机浏览器。',
                },
                {
                  q: '生成的内容质量如何？',
                  a: '我们采用先进的 DeepSeek V4 大模型，生成的内容质量高、逻辑清晰。建议提供详细的输入信息，效果更佳。',
                },
              ].map((item, i) => (
                <div key={i} className="card p-4">
                  <h3 className="font-medium mb-1">{item.q}</h3>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {relatedTools.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold mb-4">相关工具</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedTools.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tools/${t.id}`}
                    className="card p-4 hover:border-brand-500 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-brand-500 shrink-0"
                        style={{ background: 'var(--color-brand-50)' }}>
                        <Icon name={t.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium group-hover:text-brand-500 transition-colors">{t.name}</h3>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{t.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="card p-6 text-center gradient-bg text-white">
            <h2 className="text-xl font-bold mb-2">立即免费使用 {tool.name}</h2>
            <p className="text-sm text-white/80 mb-4">注册即享每日免费额度，全部12+款AI工具畅享</p>
            <Link
              href={`/auth?mode=register&redirect=/dashboard/tools/${tool.id}`}
              className="inline-block px-8 py-3 rounded-lg bg-white text-brand-600 font-medium hover:bg-white/90 transition-colors"
            >
              免费注册
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
