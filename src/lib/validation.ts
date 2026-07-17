import { NextResponse } from 'next/server'
import { z } from 'zod'

const emailField = z
  .string()
  .trim()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: '请输入有效的邮箱' })

export type SafeBody<T> = { ok: true; data: T } | { ok: false; response: NextResponse }

export async function parseBody<T>(schema: z.ZodType<T>, request: Request): Promise<SafeBody<T>> {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return { ok: false, response: NextResponse.json({ error: '请求体格式错误' }, { status: 400 }) }
  }
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return { ok: false, response: NextResponse.json({ error: '输入不合法' }, { status: 400 }) }
  }
  return { ok: true, data: parsed.data }
}

export const loginSchema = z.object({
  account: emailField,
  password: z.string().min(1).max(128),
})

export const registerSchema = z.object({
  account: emailField,
  password: z.string().min(8, '密码至少 8 位').max(128, '密码过长'),
  code: z.string().min(1),
  name: z.string().trim().max(32).optional(),
})

export const resetPasswordSchema = z.object({
  account: emailField,
  code: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})

export const sendCodeSchema = z.object({
  target: emailField,
  type: z.enum(['register', 'reset']).default('register'),
})

export const aiRunSchema = z.object({
  toolId: z.string().min(1),
  input: z.record(z.string(), z.unknown()).optional(),
})

export const paymentCreateSchema = z.object({
  planId: z.string().min(1),
})

export const userUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(32).optional(),
    avatar: z
      .string()
      .regex(/^https?:\/\//, 'URL must start with http')
      .max(500)
      .optional()
      .or(z.literal(''))
      .or(z.null()),
  })

export const userDeleteSchema = z.object({
  confirm: z.literal(true),
})

export function csrfOk(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site')
  if (site === 'same-origin') return true
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      const appUrl = new URL(process.env.APP_URL || 'http://localhost:3000')
      return new URL(origin).host === appUrl.host
    } catch {
      return false
    }
  }
  return false
}

export function csrfDenied(): NextResponse {
  return NextResponse.json({ error: '请求来源不合法' }, { status: 403 })
}
