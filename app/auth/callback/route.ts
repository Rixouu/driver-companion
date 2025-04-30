import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // Determine origin: Prioritize SITE_URL in production, fallback to NEXT_PUBLIC_SITE_URL, then request URL origin
  let origin: string;
  if (process.env.NODE_ENV === 'production') {
    origin = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
  } else {
    origin = 'http://localhost:3000'; // Keep localhost for development
  }

  // Ensure origin is a valid URL before proceeding
  try {
    new URL(origin); // Test if origin is valid
  } catch (error) {
    console.error(`Invalid origin determined: ${origin}. Falling back to request URL origin.`);
    origin = requestUrl.origin; // Fallback to the request's origin if determined one is invalid
  }

  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard'

  if (code) {
    const cookieStore = cookies() // Get cookie store instance
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore }) // Pass function reference
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error("Error exchanging code for session:", error);
      // Redirect to an error page or login page if exchange fails
      const errorUrl = new URL("/auth/error", origin); // Example error route
      errorUrl.searchParams.set("message", "Authentication failed. Please try again.");
      return NextResponse.redirect(errorUrl.toString());
    }
  }

  // Construct the final URL using the validated origin
  try {
    const finalRedirectUrl = new URL(redirectTo, origin);
    return NextResponse.redirect(finalRedirectUrl.toString())
  } catch (error) {
     console.error(`Error constructing final redirect URL with redirectTo: ${redirectTo} and origin: ${origin}`, error);
     // Fallback redirect if construction fails (e.g., to dashboard)
     const fallbackUrl = new URL("/dashboard", origin);
     return NextResponse.redirect(fallbackUrl.toString());
  }
} 