import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // Get the origin based on environment
  const origin = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : (requestUrl.searchParams.get('origin') || process.env.NEXT_PUBLIC_SITE_URL)
    
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Construct the final URL using the correct origin
  const finalRedirectUrl = new URL(redirectTo, origin)

  return NextResponse.redirect(finalRedirectUrl.toString())
} 