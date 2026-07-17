'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { isEmail } from '@/lib/utils'
import { Loader2, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [account, setAccount] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [success, setSuccess] = useState(false)

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
        body: JSON.stringify({ target: account, type: 'reset' }),
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

    if (!account || !code || !newPassword) {
      setError('请填写完整信息')
      return
    }
    if (newPassword.length < 8) {
      setError('密码至少 8 位')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, code, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '重置失败')
        return
      }
      setSuccess(true)
      redirectTimer.current = setTimeout(() => router.push('/auth?mode=login'), 3000)
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current)
    }
  }, [])

  if (success) {
    return (
      <>
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-md text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">密码重置成功</h1>
            <p style={{ color: 'var(--muted)' }} className="mb-6">即将跳转到登录页...</p>
            <Link href="/auth?mode=login" className="btn-primary inline-block">前往登录</Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">找回密码</h1>
            <p style={{ color: 'var(--muted)' }}>通过邮箱验证码重置密码</p>
          </div>

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            {error && (
              <div className="px-4 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/20">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--muted)' }}>注册邮箱</label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="输入注册时的邮箱"
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
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--muted)' }}>新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 8 位"
                className="input-field"
                autoComplete="new-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  重置中...
                </>
              ) : '重置密码'}
            </button>
          </form>

          <p className="text-center mt-4 text-sm" style={{ color: 'var(--muted)' }}>
            想起密码了？{' '}
            <Link href="/auth?mode=login" className="text-brand-500 hover:underline">
              返回登录
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}
