"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Image } from "@/components/shared/image"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { createClient } from "@/lib/supabase/index"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isRecovering, setIsRecovering] = React.useState(false)
  const { toast } = useToast()
  const supabase = React.useMemo(() => createClient(), []);

  const errorParam = searchParams?.get("error")
  const [error, setError] = React.useState<string | null>(
    errorParam === "no_code" ? "Authentication failed. Please try again." : null
  )

  const redirectTo = searchParams?.get("redirectTo") || "/dashboard"
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''

  async function handleGoogleLogin() {
    try {
      setIsLoading(true)
      setError(null)
      
      let callbackUrl: URL
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                       (process.env.NODE_ENV === 'development' 
                          ? 'http://localhost:3000' 
                          : currentOrigin)
        
        if (!baseUrl) {
          throw new Error('Could not determine site URL')
        }
        
        callbackUrl = new URL('/auth/callback', baseUrl)
        callbackUrl.searchParams.set('origin', currentOrigin)
        callbackUrl.searchParams.set('redirect_to', redirectTo)
      } catch (urlError) {
        console.error('Error creating callback URL:', urlError)
        callbackUrl = new URL(`${currentOrigin}/auth/callback`)
        callbackUrl.searchParams.set('redirect_to', redirectTo)
      }
      
      console.log('Auth callback URL:', callbackUrl.toString())
      
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (signInError) throw signInError
    } catch (loginError) {
      console.error('Login error:', loginError)
      setError(loginError instanceof Error ? loginError.message : 'Failed to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRecovery() {
    try {
      setIsRecovering(true)
      await supabase.auth.signOut({ scope: 'local' });
      
      toast({
        title: "Recovery complete",
        description: "Authentication state has been cleared. Please try signing in again.",
      })
      
      window.location.reload()
    } catch (recoveryErr) {
      console.error('Recovery error:', recoveryErr)
      setError('Recovery failed. Please try again or contact support.')
    } finally {
      setIsRecovering(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-[350px]">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-[200px] text-center">
              <Image
                src="/img/driver-header-logo.png"
                alt="Driver Logo"
                width={200}
                height={50}
                priority
                className="h-auto w-full"
                unoptimized
              />
            </div>
            <Card className="w-full">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                <CardDescription>
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Button
                  variant="outline"
                  type="button"
                  disabled={isLoading || isRecovering}
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
              </CardContent>
              <CardFooter className="flex flex-col items-center justify-center text-sm text-muted-foreground">
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Having trouble signing in?
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs h-auto p-0 mt-1"
                  disabled={isRecovering || isLoading}
                  onClick={handleRecovery}
                >
                  {isRecovering ? (
                    <>
                      <Icons.spinner className="mr-1 h-3 w-3 animate-spin" />
                      Fixing...
                    </>
                  ) : (
                    "Fix authentication issues"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 