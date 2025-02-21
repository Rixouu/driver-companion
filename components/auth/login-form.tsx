"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Image } from "@/components/shared/image"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { supabase } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(false)

  const redirectTo = searchParams.get("redirectTo") || "/dashboard"
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''

  async function handleGoogleLogin() {
    try {
      setIsLoading(true)
      
      // Get the callback URL based on environment
      const callbackUrl = new URL(
        '/auth/callback', 
        process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000' 
          : process.env.NEXT_PUBLIC_SITE_URL
      )
      
      // Add the current origin and redirect path as parameters
      callbackUrl.searchParams.set('origin', window.location.origin)
      callbackUrl.searchParams.set('redirect_to', redirectTo)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-[400px] text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/img/driver-header-logo.png"
            alt="Driver Logo"
            width={240}
            height={60}
            priority
            className="h-auto w-full"
            unoptimized
          />
        </div>

        {/* Card */}
        <Card className="border-0 bg-black/50 text-white">
          <CardHeader className="space-y-3 pb-4">
            <CardTitle className="text-3xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-lg text-gray-400">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full border-gray-800 bg-transparent text-white hover:bg-white/10"
            >
              {isLoading ? (
                <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Icons.google className="mr-2 h-5 w-5" />
              )}
              Continue with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 