import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs' // Change runtime to nodejs instead of edge

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  return NextResponse.next()
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