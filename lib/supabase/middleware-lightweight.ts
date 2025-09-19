import { NextResponse, type NextRequest } from 'next/server';


interface LightweightSessionResult {
  response: NextResponse;
  user: { id: string; email: string } | null;
}

/**
 * Lightweight middleware session handler
 * Optimized for minimal bundle size by avoiding heavy Supabase imports
 */
export async function updateSessionLightweight(request: NextRequest): Promise<LightweightSessionResult> {
  let response = NextResponse.next({
    request,
  });

  // Extract session from cookies directly (lightweight approach)
  const sessionCookie = request.cookies.get('sb-access-token')?.value;
  const refreshToken = request.cookies.get('sb-refresh-token')?.value;
  
  // Basic session validation without heavy Supabase client
  let user: { id: string; email: string } | null = null;
  
  if (sessionCookie) {
    try {
      // Decode JWT token payload (lightweight JWT decode)
      const payload = JSON.parse(atob(sessionCookie.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is not expired
      if (payload.exp && payload.exp > now) {
        user = {
          id: payload.sub || payload.user_id,
          email: payload.email
        };
      }
    } catch (error) {
      // Token is invalid or malformed
      console.warn('Invalid session token in middleware');
    }
  }

  return { response, user };
}
