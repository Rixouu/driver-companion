import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectTo = url.searchParams.get('redirectTo') || '/dashboard'
  const origin = url.searchParams.get('origin')

  // Redirect to the original origin with the auth callback
  const finalRedirectUrl = `${origin}/auth/callback?redirectTo=${redirectTo}`
  return NextResponse.redirect(finalRedirectUrl)
} 