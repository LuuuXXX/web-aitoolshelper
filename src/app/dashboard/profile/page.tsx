'use client'

import { useState, useEffect } from 'react'
import DashboardNav from '@/components/DashboardNav'
import * as Icons from 'lucide-react'

interface UserData {
  id: string
  email: string | null
  phone: string | null
  name: string | null
  avatar: string | null
  plan: string
  planExpire: string | null
  dailyLimit: number
  usedToday: number
  createdAt: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/user')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
          setName(data.user.name || '')
        }
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen">
        <DashboardNav />
        <main className="flex-1 pt-14 lg:pt-0 flex items-center justify-center">
          <Icons.Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">个人设置</h1>

          <div className="card p-6 space-y-4">
            <h3 className="font-bold">基本信息</h3>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--muted)' }}>昵称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="设置昵称"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--muted)' }}>邮箱</label>
              <input
                type="text"
                value={user.email || '未绑定'}
                disabled
                className="input-field opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--muted)' }}>手机号</label>
              <input
                type="text"
                value={user.phone || '未绑定'}
                disabled
                className="input-field opacity-60"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <Icons.Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Icons.Check className="w-4 h-4" />
              ) : null}
              {saving ? '保存中...' : saved ? '已保存' : '保存修改'}
            </button>
          </div>

          <div className="card p-6 mt-4">
            <h3 className="font-bold mb-4">订阅信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p style={{ color: 'var(--muted)' }}>当前套餐</p>
                <p className="font-medium">
                  {user.plan === 'free' ? '免费用户' : user.plan === 'monthly' ? '月度会员' : user.plan === 'quarterly' ? '季度会员' : '年度会员'}
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--muted)' }}>到期时间</p>
                <p className="font-medium">{user.planExpire ? new Date(user.planExpire).toLocaleDateString('zh-CN') : '-'}</p>
              </div>
              <div>
                <p style={{ color: 'var(--muted)' }}>每日额度</p>
                <p className="font-medium">{user.dailyLimit} 次</p>
              </div>
              <div>
                <p style={{ color: 'var(--muted)' }}>今日已用</p>
                <p className="font-medium">{user.usedToday} 次</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
