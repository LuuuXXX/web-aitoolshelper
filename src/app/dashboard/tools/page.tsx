import DashboardNav from '@/components/DashboardNav'
import { TOOLS, CATEGORIES } from '@/config/tools'
import Link from 'next/link'
import Icon from '@/components/Icon'

export default function ToolsListPage() {
  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">工具库</h1>
          {CATEGORIES.map((category) => {
            const tools = TOOLS.filter((t) => t.category === category.id)
            if (!tools.length) return null
            return (
              <div key={category.id} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center text-white">
                    <Icon name={category.icon} className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold">{category.name}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/dashboard/tools/${tool.id}`}
                      className="card p-4 hover:border-brand-500 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
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
                      <h4 className="font-medium group-hover:text-brand-500 transition-colors">{tool.name}</h4>
                      <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{tool.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
