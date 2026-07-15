import DashboardNav from '@/components/DashboardNav'
import { TOOLS, CATEGORIES } from '@/config/tools'
import { getCurrentUser, isPremiumUser } from '@/lib/dal'
import Link from 'next/link'
import Icon from '@/components/Icon'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const premium = user ? isPremiumUser(user) : false
  const remaining = user ? user.dailyLimit - (user.usedToday || 0) : 0

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 lg:ml-0 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">
              欢迎回来，{user?.name || '用户'} 👋
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              {premium ? `你的${user?.plan === 'yearly' ? '年度' : user?.plan === 'quarterly' ? '季度' : '月度'}会员` : '免费体验中'}
              {premium && user?.planExpire ? `，有效期至 ${new Date(user.planExpire).toLocaleDateString('zh-CN')}` : ''}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card p-4">
              <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>今日剩余</p>
              <p className="text-2xl font-bold gradient-text">{remaining}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>次使用额度</p>
            </div>
            <div className="card p-4">
              <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>当前套餐</p>
              <p className="text-2xl font-bold">
                {user?.plan === 'free' ? '免费' : user?.plan === 'monthly' ? '月度' : user?.plan === 'quarterly' ? '季度' : '年度'}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>会员</p>
            </div>
            <div className="card p-4">
              <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>可用工具</p>
              <p className="text-2xl font-bold">{TOOLS.length}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>款 AI 工具</p>
            </div>
            <div className="card p-4">
              <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>注册时间</p>
              <p className="text-lg font-bold">
                {user ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}
              </p>
            </div>
          </div>

          {!premium && (
            <div className="card p-6 mb-8 gradient-bg text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">升级会员，解锁更多功能</h3>
                  <p className="text-sm text-white/80">每月仅需 ¥19，即可享受每日 100 次使用额度</p>
                </div>
                <Link href="/pricing" className="px-6 py-2.5 rounded-lg bg-white text-brand-600 font-medium hover:bg-white/90 transition-colors">
                  查看套餐
                </Link>
              </div>
            </div>
          )}

          {/* Quick tools */}
          <h2 className="text-lg font-bold mb-4">快速开始</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.slice(0, 6).map((tool) => (
              <Link
                key={tool.id}
                href={`/dashboard/tools/${tool.id}`}
                className="card p-4 hover:border-brand-500 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-brand-500 shrink-0"
                    style={{ background: 'var(--color-brand-50)' }}>
                    <Icon name={tool.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium group-hover:text-brand-500 transition-colors">{tool.name}</h4>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{tool.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
