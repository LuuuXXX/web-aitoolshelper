'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { isEmail } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

function AuthForm() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  )

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(
    searchParams.get('error') === 'session_expired' ? '登录状态已失效，请重新登录' : ''
  )
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  function switchMode(m: 'login' | 'register') {
    setMode(m)
    setError('')
    setCode('')
  }

  async function sendCode() {
    setError('')
    if (!email) {
      setError('请先输入邮箱')
      return
    }
    if (!isEmail(email)) {
      setError('请输入有效的邮箱')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: email, type: 'register' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '发送失败')
        return
      }
      setCountdown(60)
    } catch {
      setError('网络错误')
    } finally {
      setSending(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('请填写完整信息')
      return
    }
    if (mode === 'register' && password.length < 8) {
      setError('密码至少 8 位')
      return
    }
    if (mode === 'register' && !code) {
      setError('请输入验证码')
      return
    }

    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload: Record<string, string> = { account: email, password }
      if (mode === 'register') {
        payload.code = code
        if (name) payload.name = name
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '操作失败')
        return
      }
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      try {
        const verifyRes = await fetch('/api/auth/session', { method: 'GET' })
        const verifyData = await verifyRes.json()
        if (!verifyData.authenticated) {
          setError('登录会话建立失败，可能因网络环境或安全设置导致，请重试或联系管理员。')
          return
        }
      } catch {
        setError('登录会话建立失败，可能因网络环境或安全设置导致，请重试或联系管理员。')
        return
      }
      window.location.href = redirectTo
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
            <h1 className="text-2xl font-bold mb-2">
              {mode === 'login' ? '欢迎回来' : '创建账号'}
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              {mode === 'login' ? '登录你的 AI工具箱 账号' : '注册即可免费体验所有 AI 工具'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            {error && (
              <div className="px-4 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/20">
                {error}
              </div>
            )}

            {mode === 'register' && (
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
            )}

            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--muted)' }}>邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="输入邮箱"
                className="input-field"
                autoComplete="email"
              />
            </div>

            {mode === 'register' && (
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
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ color: 'var(--muted)' }}>密码</label>
                {mode === 'login' && (
                  <Link href="/forgot-password" className="text-xs text-brand-500 hover:underline">
                    忘记密码?
                  </Link>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? '至少 8 位' : '输入密码'}
                className="input-field"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'login' ? '登录中...' : '注册中...'}
                </>
              ) : (
                mode === 'login' ? '登录' : '注册'
              )}
            </button>
          </form>

          <p className="text-center mt-4 text-sm" style={{ color: 'var(--muted)' }}>
            {mode === 'login' ? (
              <>
                还没有账号？{' '}
                <button onClick={() => switchMode('register')} className="text-brand-500 hover:underline">
                  立即注册
                </button>
              </>
            ) : (
              <>
                已有账号？{' '}
                <button onClick={() => switchMode('login')} className="text-brand-500 hover:underline">
                  立即登录
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  )
}
