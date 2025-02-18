import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export const runtime = 'nodejs' // Change runtime to nodejs instead of edge

// Define public routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/signup', '/auth/error']

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Allow access to public routes and static files
  if (publicRoutes.includes(pathname) || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/api')) {
    return res
  }

  // Redirect to login if not authenticated
  if (!session) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|ico|jpg|jpeg|png|gif|webp)$).*)',
  ],
} 