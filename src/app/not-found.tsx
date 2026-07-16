import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4" style={{ color: 'var(--muted)' }}>404</h1>
        <p className="mb-6 text-lg" style={{ color: 'var(--muted)' }}>
          页面不存在或已被移除
        </p>
        <Link href="/" className="btn-primary inline-block">
          返回首页
        </Link>
      </div>
    </div>
  )
}
