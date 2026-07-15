'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { isEmail } from '@/lib/utils'

export default function RegisterPage() {
  const router = useRouter()
  const [account, setAccount] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [devCode, setDevCode] = useState('')

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  async function sendCode() {
    setError('')
    if (!account) {
      setError('请先输入邮箱')
      return
    }
    if (!isEmail(account)) {
      setError('请输入有效的邮箱')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: account, type: 'register' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '发送失败')
        return
      }
      setCountdown(60)
      if (data.devCode) {
        setDevCode(data.devCode)
      }
    } catch {
      setError('网络错误')
    } finally {
      setSending(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!account || !password) {
      setError('请填写完整信息')
      return
    }
    if (password.length < 8) {
      setError('密码至少 8 位')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, password, code: code || undefined, name: name || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '注册失败')
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
      <main className="flex-1 pt-16 flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">创建账号</h1>
            <p style={{ color: 'var(--muted)' }}>注册即可免费体验所有 AI 工具</p>
          </div>

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            {error && (
              <div className="px-4 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/20">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--muted)' }}>昵称（可选）</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="给自己起个昵称"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--muted)' }}>邮箱</label>
              <input
                type="email"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="输入邮箱"
                className="input-field"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--muted)' }}>验证码</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="输入验证码"
                  className="input-field flex-1"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sending || countdown > 0}
                  className="px-4 py-2 rounded-lg border text-sm whitespace-nowrap transition-colors hover:border-brand-500 disabled:opacity-50"
                  style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}
                >
                  {countdown > 0 ? `${countdown}s` : '发送验证码'}
                </button>
              </div>
              {devCode && (
                <p className="mt-1 text-xs text-orange-500">开发模式验证码：{devCode}</p>
              )}
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--muted)' }}>密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 位"
                className="input-field"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <p className="text-center mt-4 text-sm" style={{ color: 'var(--muted)' }}>
            已有账号？{' '}
            <Link href="/login" className="text-brand-500 hover:underline">
              立即登录
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}
