import { NextResponse, type NextRequest } from 'next/server'
import { updateSessionLightweight } from '@/lib/supabase/middleware-lightweight'

// Organization domain for access control
const ORGANIZATION_DOMAIN = 'japandriver.com'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Use lightweight session handler
  const { response, user: sessionUser } = await updateSessionLightweight(request)

  // Avoid interfering with API routes to prevent JSON consumers from receiving HTML redirects
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  if (isApiRoute) {
    return response
  }

  // Check if user is authenticated
  const isAuth = !!sessionUser
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isPublicPage = request.nextUrl.pathname === '/'
  const isNotAuthorizedPage = request.nextUrl.pathname === '/not-authorized'
  
  // Check if this is a quotation page (either list or details)
  const isQuotationDetailsPage = request.nextUrl.pathname.match(/^\/(dashboard\/)?quotations\/[^\/]+$/)
  const isQuotationsListPage = request.nextUrl.pathname === '/quotations' || request.nextUrl.pathname === '/dashboard/quotations'
  
  // Check if this is a magic link quote access page
  const isQuoteAccessPage = request.nextUrl.pathname.startsWith('/quote-access/')
  
  // Check if user is from the organization
  const isOrganizationMember = isAuth && 
    sessionUser?.email?.endsWith(`@${ORGANIZATION_DOMAIN}`)

  // Redirect rules
  if (isAuthPage) {
    // If user is already authenticated and tries to access auth pages,
    // redirect to dashboard
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // If user is not authenticated, allow access to auth pages
    return response
  }

  // Allow public pages
  if (isPublicPage) {
    return response
  }

  // Allow quote access pages (magic links)
  if (isQuoteAccessPage) {
    return response
  }

  // Allow quotation pages for any authenticated user
  if (isQuotationDetailsPage || isQuotationsListPage) {
    if (!isAuth) {
      // Redirect to login if not authenticated
      let from = request.nextUrl.pathname
      if (request.nextUrl.search) {
        from += request.nextUrl.search
      }
      
      return NextResponse.redirect(
        new URL(`/auth/login?redirectTo=${encodeURIComponent(from)}`, request.url)
      )
    }
    return response
  }

  // Redirect from old quotation routes to new ones
  if (request.nextUrl.pathname === '/dashboard/quotations' || request.nextUrl.pathname === '/dashboard/quotations/') {
    return NextResponse.redirect(new URL('/quotations', request.url))
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
    return response
  }
  
  // Check for non-organization members accessing protected areas
  // Allow quotation-related pages for any authenticated user
  if (
    isAuth &&
    !isOrganizationMember &&
    !isQuotationDetailsPage &&
    !isQuotationsListPage &&
    !isAuthPage &&
    !isPublicPage &&
    !isNotAuthorizedPage
  ) {
    // Redirect customers to quotations instead of blocking outright
    return NextResponse.redirect(new URL('/quotations', request.url))
  }

  return response
}

// Configure which paths should be handled by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     * - api (API routes must not be handled by middleware to avoid HTML redirects)
     * - auth folder (except for signout)
     * - quote-access (magic link pages)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|api/|quote-access|.*\\.(?:svg|ico|jpg|jpeg|png|gif|webp|woff2|ttf)$).*)',
  ],
}
