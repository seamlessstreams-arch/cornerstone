import { NextRequest, NextResponse } from 'next/server'
import { normalizeAppRole } from '@/lib/auth/roles'
import { isRouteAllowed } from '@/lib/auth/rbac'
import { updateSupabaseSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/', '/auth/sign-in', '/auth/reset-password', '/auth/sign-out']

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function toSignInRedirect(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/auth/sign-in'
  redirectUrl.search = `?next=${encodeURIComponent(`${request.nextUrl.pathname}${request.nextUrl.search}`)}`
  return NextResponse.redirect(redirectUrl)
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/_next') || pathname.startsWith('/api/public')) {
    return NextResponse.next()
  }

  if (process.env.NODE_ENV !== 'production' && pathname.startsWith('/registered-manager')) {
    return NextResponse.next()
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const { user, response } = await updateSupabaseSession(request)

  if (!user) {
    return toSignInRedirect(request)
  }

  const role = normalizeAppRole(user.app_metadata?.cornerstone_role ?? user.app_metadata?.role ?? user.user_metadata?.role)

  if (!isRouteAllowed(pathname, role)) {
    const deniedUrl = request.nextUrl.clone()
    deniedUrl.pathname = '/dashboard'
    deniedUrl.search = '?denied=1'
    return NextResponse.redirect(deniedUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}