'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Icon from '@/components/Icon'
import { getPlanLabel } from '@/config/pricing'
import { Menu, LogOut } from 'lucide-react'

interface UserInfo {
  id: string
  name: string
  email: string | null
  plan: string
  planExpire: string | null
  dailyLimit: number
  usedToday: number
}

export default function DashboardNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetch('/api/user')
      .then((r) => {
        if (r.status === 401) {
          window.location.href = '/auth?mode=login&error=session_expired'
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (data?.user) setUser(data.user)
      })
      .catch(() => {})
  }, [pathname])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
    } finally {
      window.location.href = '/auth?mode=login'
    }
  }

  const navItems = [
    { href: '/dashboard', label: '控制台', icon: 'LayoutDashboard' },
    { href: '/dashboard/tools', label: '工具库', icon: 'Wrench' },
    { href: '/dashboard/history', label: '历史记录', icon: 'History' },
    { href: '/dashboard/profile', label: '个人设置', icon: 'Settings' },
    { href: '/pricing', label: '升级套餐', icon: 'Crown' },
  ]

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b h-14 flex items-center px-4"
        style={{ borderColor: 'var(--card-border)' }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          <Menu className="w-5 h-5" />
        </button>
        <span className="ml-2 font-bold gradient-text">AI工具箱</span>
      </div>

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 p-4 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--card-bg)', borderRight: '1px solid var(--card-border)' }}
      >
        <div className="hidden lg:flex items-center gap-2 mb-6 px-2">
          <Link href="/" className="font-bold text-lg gradient-text">AI工具箱</Link>
        </div>
        <div className="lg:mt-0 mt-14" />

        <div className="card p-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name || '用户'}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {getPlanLabel(user?.plan || 'free')}
              </p>
            </div>
          </div>
          {user && (
            <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--muted)' }}>今日用量</span>
                <span className="font-medium">{user.usedToday}/{user.dailyLimit}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                <div
                  className="h-full gradient-bg transition-all"
                  style={{ width: `${Math.min((user.usedToday / (user.dailyLimit || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/pricing' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? 'gradient-bg text-white' : 'hover:bg-brand-50'
                }`}
                style={!active ? { color: 'var(--foreground)' } : {}}
              >
                <Icon name={item.icon} className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 px-3 py-2 mt-4 rounded-lg text-sm transition-colors hover:bg-red-50 text-red-500 disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  )
}
