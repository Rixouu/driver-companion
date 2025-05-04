import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log("[Auth Callback] Received request");
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // Log environment variables and request details
  console.log(`[Auth Callback] Request URL: ${request.url}`);
  console.log(`[Auth Callback] Request Origin: ${requestUrl.origin}`);
  
  // Try to get origin from the request parameters first (set by the login form)
  let origin = requestUrl.searchParams.get('origin');
  
  // Fallback chain for determining origin
  if (!origin) {
    // Use the most reliable source first
    if (typeof process.env.NEXT_PUBLIC_SITE_URL === 'string' && process.env.NEXT_PUBLIC_SITE_URL.startsWith('http')) {
      origin = process.env.NEXT_PUBLIC_SITE_URL;
      console.log(`[Auth Callback] Using NEXT_PUBLIC_SITE_URL: ${origin}`);
    }
    // Then try VERCEL_URL if in production
    else if (process.env.NODE_ENV === 'production' && process.env.VERCEL_URL) {
      origin = process.env.VERCEL_URL.startsWith('http') 
                 ? process.env.VERCEL_URL 
                 : `https://${process.env.VERCEL_URL}`;
      console.log(`[Auth Callback] Using VERCEL_URL: ${origin}`);
    }
    // Fallback to request origin as the last resort
    else {
      origin = requestUrl.origin;
      console.log(`[Auth Callback] Using request origin: ${origin}`);
    }
  } else {
    console.log(`[Auth Callback] Using origin from request params: ${origin}`);
  }
  
  // Validate the origin is a proper URL
  try {
    new URL(origin);
  } catch (error) {
    console.error(`[Auth Callback] Invalid origin: ${origin}, falling back to request origin`);
    origin = requestUrl.origin;
  }

  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard'
  console.log(`[Auth Callback] Redirect Path: ${redirectTo}`);

  if (code) {
    console.log("[Auth Callback] Code found, attempting exchange...");
    // Initialize Supabase client with direct cookies reference for Next.js 15
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    try {
      await supabase.auth.exchangeCodeForSession(code)
      console.log("[Auth Callback] Code exchange successful.");
    } catch (error) {
      console.error("[Auth Callback] Error exchanging code for session:", error);
      // Redirect to an error page with details
      return NextResponse.redirect(new URL(`/auth/error?message=${encodeURIComponent('Authentication failed. Please try again.')}`, origin));
    }
  } else {
    console.log("[Auth Callback] No code found in request.");
    return NextResponse.redirect(new URL('/auth/login?error=no_code', origin));
  }

  // Handle final redirect
  try {
    // Create the final redirect URL
    let finalRedirectUrl: URL;
    
    // Check if redirect path is already a full URL (starts with http)
    if (redirectTo.startsWith('http')) {
      finalRedirectUrl = new URL(redirectTo);
    } else {
      // Otherwise, combine with origin
      finalRedirectUrl = new URL(redirectTo, origin);
    }
    
    console.log(`[Auth Callback] Final Redirect URL: ${finalRedirectUrl.toString()}`);
    return NextResponse.redirect(finalRedirectUrl.toString());
  } catch (error) {
    console.error(`[Auth Callback] Error constructing redirect URL:`, error);
    // Fallback to dashboard
    return NextResponse.redirect(new URL('/dashboard', origin));
  }
} 