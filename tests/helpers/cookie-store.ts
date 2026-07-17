const g = globalThis as unknown as {
  __cookieStore?: Map<string, string>
  __cookieSetCalls?: Array<{ name: string; value: string; opts?: Record<string, unknown> }>
}

if (!g.__cookieStore) g.__cookieStore = new Map()
if (!g.__cookieSetCalls) g.__cookieSetCalls = []

export function resetCookies() {
  g.__cookieStore!.clear()
  g.__cookieSetCalls!.length = 0
}

export function setCookieValue(name: string, value: string) {
  g.__cookieStore!.set(name, value)
}

export function getCookieValue(name: string): string | undefined {
  return g.__cookieStore!.get(name)
}

export function lastSetCall() {
  return g.__cookieSetCalls![g.__cookieSetCalls!.length - 1]
}

export function cookieStore() {
  return g.__cookieStore!
}
