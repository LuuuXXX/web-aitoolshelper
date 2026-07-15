'use client'

import { useState, useEffect } from 'react'
import DashboardNav from '@/components/DashboardNav'
import Link from 'next/link'
import { TOOLS } from '@/config/tools'
import * as Icons from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const toolMap = Object.fromEntries(TOOLS.map((t) => [t.id, t]))

interface HistoryRecord {
  id: string
  toolId: string
  input: string
  output: string
  tokensUsed: number
  createdAt: string
}

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<HistoryRecord | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/ai/history?page=${page}`)
        const data = await res.json()
        if (!cancelled && data.records) {
          setRecords(data.records)
          setTotalPages(data.totalPages)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [page])

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">历史记录</h1>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Icons.Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="card p-12 text-center">
              <Icons.History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="mb-4" style={{ color: 'var(--muted)' }}>暂无使用记录</p>
              <Link href="/dashboard/tools" className="btn-primary inline-block">开始使用</Link>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {records.map((record) => {
                  const tool = toolMap[record.toolId]
                  let inputPreview = ''
                  try {
                    const input = JSON.parse(record.input)
                    inputPreview = Object.values(input).filter(Boolean).join(' / ')
                  } catch {
                    inputPreview = record.toolId
                  }
                  return (
                    <div
                      key={record.id}
                      className="card p-4 cursor-pointer hover:border-brand-500 transition-all"
                      onClick={() => setSelected(record)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{tool?.name || record.toolId}</span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          {formatDateTime(record.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm truncate" style={{ color: 'var(--muted)' }}>{inputPreview}</p>
                    </div>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    上一页
                  </button>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}

          {/* Detail modal */}
          {selected && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelected(null)}>
              <div className="card max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
                  <h3 className="font-bold">{toolMap[selected.toolId]?.name || selected.toolId}</h3>
                  <button onClick={() => setSelected(null)} className="p-1">
                    <Icons.X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto scrollbar-thin">
                  <div className="mb-4">
                    <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>输入</p>
                    <div className="text-sm whitespace-pre-wrap p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                      {(() => {
                        try { return Object.entries(JSON.parse(selected.input)).map(([k, v]) => `${k}: ${v}`).join('\n')
                        } catch { return selected.input }
                      })()}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>输出</p>
                    <div className="text-sm whitespace-pre-wrap p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                      {selected.output}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
