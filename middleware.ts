import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Organization domain for access control
const ORGANIZATION_DOMAIN = 'japandriver.com'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // updateSession now returns the response, Supabase client, and user
  const { response, supabase, user: sessionUser } = await updateSession(request)

  // If Supabase client couldn't be initialized (e.g., missing env vars), sessionUser might be null
  // and supabase might be a placeholder. Handle critical errors or proceed cautiously.
  if (!supabase?.auth) { // Basic check if supabase client is valid
      console.error("Middleware: Supabase client not initialized correctly. Check environment variables.")
      // Depending on the application's needs, might return response early or throw error
      return response
  }

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
  
  // Check if user is from the organization
  const isOrganizationMember = isAuth && 
    sessionUser.email?.endsWith(`@${ORGANIZATION_DOMAIN}`)

  // Redirect rules
  if (isAuthPage) {
    if (isAuth) {
      // Redirect authenticated users to intended destination if provided
      const redirectToParam = request.nextUrl.searchParams.get('redirectTo') || ''
      const hasSafeRedirect = redirectToParam.startsWith('/') && !redirectToParam.startsWith('//')

      // Non-organization members should land on quotations by default
      const defaultAuthedPath = isOrganizationMember ? '/dashboard' : '/quotations'
      const targetPath = hasSafeRedirect ? redirectToParam : defaultAuthedPath

      return NextResponse.redirect(new URL(targetPath, request.url))
    }
    // Allow access to auth pages for non-authenticated users
    return response
  }
  
  // Special handling for quotation details pages
  if (isQuotationDetailsPage) {
    if (isAuth) {
      // If user is authenticated, continue - we'll check organization status in the page component
      return response
    } else {
      // If not authenticated, redirect to login
      return NextResponse.redirect(
        new URL(`/auth/login?redirectTo=${encodeURIComponent(request.nextUrl.pathname)}`, request.url)
      )
    }
  }
  
  // Special handling for quotations list page - allow customer access
  if (isQuotationsListPage) {
    if (isAuth) {
      // If user is authenticated, continue - we'll filter quotations based on user type in the page component
      return response
    } else {
      // If not authenticated, redirect to login
      return NextResponse.redirect(
        new URL(`/auth/login?redirectTo=${encodeURIComponent(request.nextUrl.pathname)}`, request.url)
      )
    }
  }

  // If authenticated customer visits root, send them to quotations list directly
  if (isAuth && !isOrganizationMember && isPublicPage) {
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
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|api/|.*\\.(?:svg|ico|jpg|jpeg|png|gif|webp|woff2|ttf)$).*)',
  ],
} 