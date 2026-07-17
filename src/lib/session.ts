import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

function parseDurationToSeconds(input: string): number {
  const match = input.trim().match(/^(\d+)\s*(d|h|m|s)?$/i)
  if (!match) return 7 * 24 * 3600
  const value = parseInt(match[1], 10)
  switch ((match[2] || 's').toLowerCase()) {
    case 'd':
      return value * 86400
    case 'h':
      return value * 3600
    case 'm':
      return value * 60
    default:
      return value
  }
}

export const SESSION_MAX_AGE = process.env.SESSION_MAX_AGE || process.env.JWT_EXPIRES || '7d'
export const SESSION_MAX_AGE_MS = parseDurationToSeconds(SESSION_MAX_AGE) * 1000

const secretKey = process.env.JWT_SECRET
if (!secretKey) {
  throw new Error('JWT_SECRET environment variable is required')
}
if (Buffer.byteLength(secretKey, 'utf8') < 32) {
  throw new Error('JWT_SECRET must be >= 32 bytes')
}
const encodedKey = new TextEncoder().encode(secretKey)

if (process.env.NODE_ENV === 'production') {
  if (!process.env.APP_URL || !process.env.APP_URL.startsWith('https://')) {
    console.error('[security] APP_URL is not https in production')
  }
  if (process.env.COOKIE_SECURE === 'false') {
    console.error('[security] COOKIE_SECURE is "false" in production; session cookies will not be Secure')
  }
}

export interface SessionPayload {
  userId: string
  role: string
  tokenVersion: number
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_MAX_AGE)
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export interface SecureContext {
  proto: string
  forwardedProto?: string
}

export function resolveSecure(ctx: SecureContext): boolean {
  if (process.env.COOKIE_SECURE === 'false') return false
  if (process.env.COOKIE_SECURE === 'true') return true
  return ctx.proto === 'https:' || ctx.forwardedProto === 'https'
}

export async function createSession(
  userId: string,
  role: string = 'user',
  tokenVersion: number = 0,
  options?: { secure?: boolean }
) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS
  const session = await encrypt({ userId, role, tokenVersion })
  const cookieStore = await cookies()
  const secure = options?.secure ?? resolveSecure({ proto: 'https:' })
  cookieStore.set('session', session, {
    httpOnly: true,
    secure,
    expires: new Date(expiresAt),
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  return decrypt(session)
}
