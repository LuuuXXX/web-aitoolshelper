import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Icon from '@/components/Icon'
import { TOOLS, CATEGORIES } from '@/config/tools'

export const metadata: Metadata = {
  title: 'AI工具库 - 12+款免费在线AI工具',
  description:
    'AI工具箱收录12+款免费在线AI工具，涵盖AI文章写作、小红书文案、广告文案、AI翻译、文档摘要、简历优化、周报生成、商业计划书、邮件助手、诗词创作等。全部免费使用，无需安装。',
  keywords: [
    'AI工具',
    '免费AI工具',
    '在线AI工具',
    'AI工具箱',
    'AI写作工具',
    'AI文案工具',
    'AI翻译工具',
  ],
  alternates: {
    canonical: '/tools',
  },
  openGraph: {
    title: 'AI工具库 - 12+款免费在线AI工具 | AI工具箱',
    description: '收录12+款免费AI工具，涵盖写作、文案、翻译、办公、创意等。全部免费使用，无需安装。',
  },
}

export default function ToolsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">AI 工具库</h1>
            <p className="text-lg" style={{ color: 'var(--muted)' }}>
              {TOOLS.length}+ 款免费在线 AI 工具，涵盖写作、营销、办公、创意，一键生成专业内容
            </p>
          </div>

          {CATEGORIES.map((category) => {
            const tools = TOOLS.filter((t) => t.category === category.id)
            if (tools.length === 0) return null
            return (
              <section key={category.id} className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white">
                    <Icon name={category.icon} className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold">{category.name}</h2>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>{tools.length} 款工具</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.id}`}
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
                      <h3 className="font-semibold mb-1 group-hover:text-brand-500 transition-colors">{tool.name}</h3>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>{tool.description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </main>
      <Footer />
    </>
  )
}
