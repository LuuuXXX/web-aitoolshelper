'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Sparkles, Copy, Check, PenTool } from 'lucide-react'
import Icon from '@/components/Icon'
import type { ToolField } from '@/config/tools'

type ToolClientData = {
  id: string
  name: string
  description: string
  icon: string
  category: string
  fields: ToolField[]
  badge?: string
}

export default function ToolRunner({ tool }: { tool: ToolClientData }) {
  const defaultValues: Record<string, string> = {}
  for (const f of tool.fields) {
    if (f.defaultValue) defaultValues[f.key] = f.defaultValue
  }
  const [values, setValues] = useState<Record<string, string>>(defaultValues)
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [needUpgrade, setNeedUpgrade] = useState(false)
  const [copied, setCopied] = useState(false)

  function setField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setOutput('')

    for (const field of tool.fields) {
      const val = values[field.key] ?? field.defaultValue ?? ''
      if (field.required && !String(val).trim()) {
        setError(`请填写${field.label}`)
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id, input: { ...defaultValues, ...values} }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '处理失败')
        setNeedUpgrade(!!data.needUpgrade)
        return
      }
      setOutput(data.output)
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('复制失败，请手动选择文本复制')
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Icon name={tool.icon} className="w-5 h-5 text-brand-500" />
            {tool.name}
          </h3>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{tool.description}</p>

          {tool.fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--muted)' }}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  className="input-field"
                  value={values[field.key] || field.defaultValue || ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  className="input-field resize-y"
                  rows={field.rows || 3}
                  maxLength={10000}
                  placeholder={field.placeholder}
                  value={values[field.key] || ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  className="input-field"
                  maxLength={500}
                  placeholder={field.placeholder}
                  value={values[field.key] || ''}
                  onChange={(e) => setField(field.key, e.target.value)}
                />
              )}
            </div>
          ))}

          {error && (
            <div className="px-4 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/20">
              {error}
              {needUpgrade && (
                <Link href="/pricing" className="block mt-1 underline hover:no-underline">
                  点击升级套餐 →
                </Link>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI 生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                生成内容
              </>
            )}
          </button>
        </form>
      </div>

      <div>
        <div className="card p-5 sticky top-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">生成结果</h3>
            {output && (
              <button
                onClick={copyOutput}
                className="flex items-center gap-1 text-sm px-3 py-1 rounded-lg border transition-colors hover:border-brand-500"
                style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '已复制' : '复制'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>正在生成内容，请稍候...</p>
            </div>
          ) : output ? (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words text-sm leading-relaxed"
              style={{ color: 'var(--foreground)' }}>
              {output}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PenTool className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                填写左侧表单，点击生成按钮<br />AI 将为你创建内容
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
