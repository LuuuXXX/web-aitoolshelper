import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-auto border-t" style={{ borderColor: 'var(--card-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-bold mb-2 gradient-text">AI工具箱</h3>
            <p style={{ color: 'var(--muted)' }}>开箱即用的AI应用服务平台</p>
          </div>
          <div>
            <h4 className="font-medium mb-2" style={{ color: 'var(--muted)' }}>产品</h4>
            <ul className="space-y-1">
              <li><Link href="/#tools" className="hover:text-brand-500" style={{ color: 'var(--foreground)' }}>工具库</Link></li>
              <li><Link href="/pricing" className="hover:text-brand-500" style={{ color: 'var(--foreground)' }}>定价方案</Link></li>
              <li><Link href="/dashboard" className="hover:text-brand-500" style={{ color: 'var(--foreground)' }}>控制台</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2" style={{ color: 'var(--muted)' }}>支持</h4>
            <ul className="space-y-1">
              <li><Link href="/docs" className="hover:text-brand-500" style={{ color: 'var(--foreground)' }}>使用文档</Link></li>
              <li><Link href="/dashboard/history" className="hover:text-brand-500" style={{ color: 'var(--foreground)' }}>历史记录</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2" style={{ color: 'var(--muted)' }}>法律</h4>
            <ul className="space-y-1">
              <li><Link href="/terms" className="hover:text-brand-500" style={{ color: 'var(--foreground)' }}>服务条款</Link></li>
              <li><Link href="/privacy" className="hover:text-brand-500" style={{ color: 'var(--foreground)' }}>隐私政策</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--card-border)', color: 'var(--muted)' }}>
          <p>© 2026 AI工具箱. 保留所有权利.</p>
          <p>湘ICP备2026026989号-1</p>
        </div>
      </div>
    </footer>
  )
}
