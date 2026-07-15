import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'

const protectedPaths = ['/dashboard', '/tools', '/pricing/payment', '/profile', '/history']
const authPaths = ['/login', '/register']

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtected = protectedPaths.some((p) => path.startsWith(p))
  const isAuthPage = authPaths.includes(path)

  if (!isProtected && !isAuthPage) {
    return NextResponse.next()
  }

  const sessionCookie = (await cookies()).get('session')?.value
  const session = await decrypt(sessionCookie)

  if (isProtected && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (isAuthPage && session?.userId) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
}
