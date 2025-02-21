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
      
      // Use the production URL for Supabase callback
      const callbackUrl = new URL(
        '/auth/callback', 
        process.env.NEXT_PUBLIC_SITE_URL
      )
      
      // Add the current origin and redirect path as parameters
      callbackUrl.searchParams.set('origin', currentOrigin)
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
    <div className="container flex h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto">
            <Image
              src="/img/driver-header-logo.png"
              alt="Driver Logo"
              width={200}
              height={50}
              priority
              className="h-auto w-auto"
              unoptimized
            />
          </div>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <Button
                  variant="outline"
                  type="button"
                  disabled={isLoading}
                  onClick={handleGoogleLogin}
                  className="w-full"
                >
                  {isLoading ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.google className="mr-2 h-4 w-4" />
                  )}
                  Continue with Google
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 