'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-3">出错了</h1>
        <p className="mb-6" style={{ color: 'var(--muted)' }}>
          页面加载时发生错误，请重试。
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary flex items-center gap-2">
            <Loader2 className="w-4 h-4" />
            重试
          </button>
          <Link href="/" className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--card-border)' }}>
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
