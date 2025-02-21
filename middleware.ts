import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs' // Change runtime to nodejs instead of edge

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Check if user is authenticated
  const isAuth = !!session
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isPublicPage = request.nextUrl.pathname === '/'

  // Redirect rules
  if (isAuthPage) {
    if (isAuth) {
      // If user is authenticated and tries to access auth page,
      // redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Allow access to auth pages for non-authenticated users
    return res
  }

  if (!isAuth && !isPublicPage) {
    // If user is not authenticated and tries to access protected page,
    // redirect to login
    let from = request.nextUrl.pathname
    if (request.nextUrl.search) {
      from += request.nextUrl.search
    }
    
    return NextResponse.redirect(
      new URL(`/auth/login?redirectTo=${encodeURIComponent(from)}`, request.url)
    )
  }

  return res
}

// Configure which paths should be handled by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth folder (except for signout)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|ico|jpg|jpeg|png|gif|webp)$).*)',
  ],
} 