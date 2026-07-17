import { NextRequest } from 'next/server'
import { encrypt } from '@/lib/session'
import { setCookieValue } from './cookie-store'

const BASE = 'http://localhost:3000'

export interface BuildReqOptions {
  method?: string
  path?: string
  body?: unknown
  csrf?: boolean
  origin?: string
  headers?: Record<string, string>
}

export function buildRequest(opts: BuildReqOptions = {}): NextRequest {
  const { method = 'POST', path = '/', body, csrf = true, origin = BASE, headers = {} } = opts
  const h = new Headers(headers)
  if (csrf) {
    h.set('sec-fetch-site', 'same-origin')
    if (origin) h.set('origin', origin)
  }
  const init: RequestInit & { headers: Headers } = { method, headers: h }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
    if (!h.has('content-type')) h.set('content-type', 'application/json')
  }
  return new NextRequest(`${BASE}${path}`, init)
}

export async function authenticateAs(
  userId: string,
  role = 'user',
  tokenVersion = 0
): Promise<void> {
  const jwt = await encrypt({ userId, role, tokenVersion })
  setCookieValue('session', jwt)
}

export async function json(res: Response): Promise<unknown> {
  return JSON.parse(await res.text())
}
