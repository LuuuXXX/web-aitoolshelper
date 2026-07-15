'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function LoginPage() {
  const router = useRouter()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!account || !password) {
      setError('请填写账号和密码')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '登录失败')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">欢迎回来</h1>
            <p style={{ color: 'var(--muted)' }}>登录你的 AI工具箱 账号</p>
          </div>

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            {error && (
              <div className="px-4 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/20">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--muted)' }}>邮箱 / 手机号</label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="输入邮箱或手机号"
                className="input-field"
                autoComplete="username"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ color: 'var(--muted)' }}>密码</label>
                <Link href="/forgot-password" className="text-xs text-brand-500 hover:underline">
                  忘记密码?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                className="input-field"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <p className="text-center mt-4 text-sm" style={{ color: 'var(--muted)' }}>
            还没有账号？{' '}
            <Link href="/register" className="text-brand-500 hover:underline">
              立即注册
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}
