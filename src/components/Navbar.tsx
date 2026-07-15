'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b' : ''
      }`}
      style={{ borderColor: 'var(--card-border)' }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="gradient-text">AI工具箱</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/#tools" className="text-sm hover:text-brand-500 transition-colors" style={{ color: 'var(--foreground)' }}>
            工具库
          </Link>
          <Link href="/pricing" className="text-sm hover:text-brand-500 transition-colors" style={{ color: 'var(--foreground)' }}>
            定价
          </Link>
          <Link href="/docs" className="text-sm hover:text-brand-500 transition-colors" style={{ color: 'var(--foreground)' }}>
            使用文档
          </Link>
          <Link href="/login" className="text-sm px-4 py-2 rounded-lg transition-colors" style={{ color: 'var(--foreground)' }}>
            登录
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            免费注册
          </Link>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="菜单"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden glass border-b px-4 py-4 space-y-3" style={{ borderColor: 'var(--card-border)' }}>
          <Link href="/#tools" onClick={() => setMenuOpen(false)} className="block text-sm py-2" style={{ color: 'var(--foreground)' }}>
            工具库
          </Link>
          <Link href="/pricing" onClick={() => setMenuOpen(false)} className="block text-sm py-2" style={{ color: 'var(--foreground)' }}>
            定价
          </Link>
          <Link href="/docs" onClick={() => setMenuOpen(false)} className="block text-sm py-2" style={{ color: 'var(--foreground)' }}>
            使用文档
          </Link>
          <div className="flex gap-3 pt-2">
            <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm py-2 rounded-lg border" style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}>
              登录
            </Link>
            <Link href="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center btn-primary text-sm">
              注册
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
