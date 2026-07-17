import 'server-only'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()
const MAX_STORE_SIZE = 10_000

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 60_000).unref()

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    if (store.size >= MAX_STORE_SIZE) {
      const oldest = [...store.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt)
      for (let i = 0; i < 1000 && i < oldest.length; i++) {
        store.delete(oldest[i][0])
      }
    }
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  entry.count++
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

export function getClientIp(request: Request): string {
  const hops = Math.max(0, parseInt(process.env.TRUSTED_PROXY_HOPS || '1', 10) || 1)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length) {
      const idx = Math.min(parts.length - 1, Math.max(0, parts.length - 1 - hops))
      const ip = parts[idx]
      if (ip) return ip
    }
  }
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}
