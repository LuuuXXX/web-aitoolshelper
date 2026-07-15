import DashboardNav from '@/components/DashboardNav'
import ToolRunner from '@/components/ToolRunner'
import Icon from '@/components/Icon'
import { getToolById } from '@/config/tools'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params
  const tool = getToolById(toolId)
  if (!tool) notFound()

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard/tools" className="inline-flex items-center gap-1 text-sm mb-3 hover:text-brand-500"
              style={{ color: 'var(--muted)' }}>
              <ArrowLeft className="w-4 h-4" />
              返回工具库
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-brand-500"
                style={{ background: 'var(--color-brand-50)' }}>
                <Icon name={tool.icon} className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{tool.name}</h1>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{tool.description}</p>
              </div>
            </div>
          </div>

          <ToolRunner tool={{
            id: tool.id,
            name: tool.name,
            description: tool.description,
            icon: tool.icon,
            category: tool.category,
            fields: tool.fields,
            badge: tool.badge,
          }} />
        </div>
      </main>
    </div>
  )
}
