import { resetCookies, setCookieValue, lastSetCall } from '../helpers/cookie-store'

export { resetCookies, setCookieValue, lastSetCall }

export async function cookies() {
  const { cookieStore } = await import('../helpers/cookie-store')
  const store = cookieStore()
  return {
    get: (name: string) => {
      const v = store.get(name)
      return v === undefined ? undefined : { value: v }
    },
    set: (name: string, value: string, opts?: Record<string, unknown>) => {
      store.set(name, value)
      const g = globalThis as unknown as { __cookieSetCalls?: Array<{ name: string; value: string; opts?: Record<string, unknown> }> }
      g.__cookieSetCalls!.push({ name, value, opts })
    },
    delete: (name: string) => {
      store.delete(name)
    },
  }
}

export async function headers() {
  return new Headers()
}
