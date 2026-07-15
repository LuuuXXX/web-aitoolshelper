import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

const protectedPaths = ['/dashboard']
const authPaths = ['/login', '/register', '/forgot-password']

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtected = protectedPaths.some((p) => path.startsWith(p))
  const isAuthPage = authPaths.includes(path)

  if (!isProtected && !isAuthPage) {
    return NextResponse.next()
  }

  const sessionCookie = req.cookies.get('session')?.value
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
