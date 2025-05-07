import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Organization domain for access control
const ORGANIZATION_DOMAIN = 'japandriver.com'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Check if user is authenticated
  const isAuth = !!session
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isPublicPage = request.nextUrl.pathname === '/'
  const isNotAuthorizedPage = request.nextUrl.pathname === '/not-authorized'
  
  // Check if this is a quotation page (either list or details)
  const isQuotationDetailsPage = request.nextUrl.pathname.match(/^\/(dashboard\/)?quotations\/[^\/]+$/)
  const isQuotationsListPage = request.nextUrl.pathname === '/quotations' || request.nextUrl.pathname === '/dashboard/quotations'
  
  // Check if user is from the organization
  const isOrganizationMember = isAuth && 
    session.user.email?.endsWith(`@${ORGANIZATION_DOMAIN}`)

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
  
  // Special handling for quotation details pages
  if (isQuotationDetailsPage) {
    if (isAuth) {
      // If user is authenticated, continue - we'll check organization status in the page component
      return res
    } else {
      // If not authenticated, redirect to login
      return NextResponse.redirect(
        new URL(`/auth/login?redirectTo=${encodeURIComponent(request.nextUrl.pathname)}`, request.url)
      )
    }
  }

  // For all other protected pages
  if (!isAuth && !isPublicPage && !isNotAuthorizedPage) {
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
  
  // Allow authenticated users to access the not-authorized page regardless of organization
  if (isAuth && isNotAuthorizedPage) {
    return res
  }
  
  // Check for non-organization members accessing protected areas
  // Allow quotation-related pages for any authenticated user
  if (isAuth && !isOrganizationMember && !isQuotationDetailsPage && !isQuotationsListPage && !isAuthPage && !isPublicPage && !isNotAuthorizedPage) {
    // If user is not part of the organization, redirect to not-authorized page
    return NextResponse.redirect(new URL('/not-authorized', request.url))
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