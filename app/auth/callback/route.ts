import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log("[Auth Callback] Received request");
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log(`[Auth Callback] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Auth Callback] VERCEL_URL: ${process.env.VERCEL_URL}`);
  console.log(`[Auth Callback] SITE_URL: ${process.env.SITE_URL}`);
  console.log(`[Auth Callback] NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL}`);
  console.log(`[Auth Callback] Request URL Origin: ${requestUrl.origin}`);

  // Determine origin: Use VERCEL_URL in production, ensure HTTPS
  let origin: string;
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_URL) {
    // Ensure VERCEL_URL starts with https:// for production
    origin = process.env.VERCEL_URL.startsWith('http') 
               ? process.env.VERCEL_URL 
               : `https://${process.env.VERCEL_URL}`;
  } else if (process.env.NODE_ENV !== 'production'){
    origin = 'http://localhost:3000'; // Keep localhost for development
  } else {
      // Fallback if VERCEL_URL is somehow missing in production
      console.warn("[Auth Callback] VERCEL_URL not found in production, falling back to request origin.")
      origin = requestUrl.origin; 
  }
  console.log(`[Auth Callback] Determined Origin (Initial): ${origin}`);

  // Ensure origin is a valid URL before proceeding (redundant check mostly, but safe)
  try {
    new URL(origin); 
    console.log(`[Auth Callback] Determined Origin (Validated): ${origin}`);
  } catch (error) {
    console.error(`[Auth Callback] Invalid origin determined even after VERCEL_URL check: ${origin}. Falling back to request URL origin.`);
    origin = requestUrl.origin; // Fallback just in case
    console.log(`[Auth Callback] Determined Origin (Final Fallback): ${origin}`);
  }

  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard'
  console.log(`[Auth Callback] Redirect Path: ${redirectTo}`);

  if (code) {
    console.log("[Auth Callback] Code found, attempting exchange...");
    const cookieStore = cookies() // Get cookie store instance
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore }) // Pass function reference
    try {
      await supabase.auth.exchangeCodeForSession(code)
      console.log("[Auth Callback] Code exchange successful.");
    } catch (error) {
      console.error("[Auth Callback] Error exchanging code for session:", error);
      // Redirect to an error page or login page if exchange fails
      const errorUrl = new URL("/auth/error", origin); // Example error route
      errorUrl.searchParams.set("message", "Authentication failed. Please try again.");
      console.log(`[Auth Callback] Redirecting to error page: ${errorUrl.toString()}`);
      return NextResponse.redirect(errorUrl.toString());
    }
  } else {
    console.log("[Auth Callback] No code found in request.");
  }

  // Construct the final URL using the validated origin
  console.log(`[Auth Callback] Constructing final redirect URL with redirectTo: ${redirectTo} and origin: ${origin}`);
  try {
    const finalRedirectUrl = new URL(redirectTo, origin);
    console.log(`[Auth Callback] Final Redirect URL: ${finalRedirectUrl.toString()}`);
    return NextResponse.redirect(finalRedirectUrl.toString())
  } catch (error) {
     console.error(`[Auth Callback] Error constructing final redirect URL with redirectTo: ${redirectTo} and origin: ${origin}`, error);
     // Fallback redirect if construction fails (e.g., to dashboard)
     const fallbackUrl = new URL("/dashboard", origin);
     console.log(`[Auth Callback] Redirecting to fallback URL: ${fallbackUrl.toString()}`);
     return NextResponse.redirect(fallbackUrl.toString());
  }
} 