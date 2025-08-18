"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, AuthError, SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/index"
import { useToast } from "@/components/ui/use-toast"
import type { Database } from "@/types/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  clearAuthAndRedirect: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
  resetPassword: async () => ({ success: false }),
  clearAuthAndRedirect: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authInitialized, setAuthInitialized] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const [supabaseClient] = useState<SupabaseClient<Database>>(() => createClient())

  useEffect(() => {
    let initialCheckDone = false
    let retryCount = 0
    const MAX_RETRIES = 2
    
    const getUser = async () => {
      console.log("[AuthProvider] Attempting initial getUser()...")
      try {
        const { data, error: getUserError } = await supabaseClient.auth.getUser()
        console.log("[AuthProvider] getUser() result:", data)

        if (!initialCheckDone) { 
             if (getUserError) {
                 console.error("[AuthProvider] Initial getUser() error:", getUserError.message)
                 setError(getUserError.message)
                 
                 if (getUserError.message.includes("Auth session missing") && retryCount < MAX_RETRIES) {
                   console.log(`[AuthProvider] Attempting recovery (${retryCount + 1}/${MAX_RETRIES})...`)
                   retryCount++
                   const { error: refreshError } = await supabaseClient.auth.refreshSession()
                   if (refreshError) {
                     console.error("[AuthProvider] Session refresh failed:", refreshError)
                   } else {
                     console.log("[AuthProvider] Session refresh successful")
                     setTimeout(getUser, 500)
                     return
                   }
                 }
             } else if (data.user) {
                 console.log("[AuthProvider] Initial getUser() success:", data.user)
                 setUser(data.user)
                 setError(null)
             }
        }
      } catch (err) {
        console.error("[AuthProvider] Unexpected error in initial getUser():", err)
        setError("An unexpected authentication error occurred")
      } finally {
        setAuthInitialized(true)
      }
    }
    
    getUser()

    const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log("[AuthProvider] onAuthStateChange event:", event, "session:", session)
        setUser(session?.user ?? null)
        setError(null) 
        initialCheckDone = true 
        setLoading(false) 
        setAuthInitialized(true)

        if (event === 'SIGNED_IN') {
            toast({
              title: "Signed in successfully",
              description: `Welcome${session?.user?.email ? ` ${session.user.email}` : ''}!`,
            })
        } else if (event === 'SIGNED_OUT') {
            toast({
              title: "Signed out",
              description: "You have been signed out successfully.",
            })
             router.push('/auth/login')
        }
    })

    setLoading(true)

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [router, toast, supabaseClient])

  const handleAuthError = (error: AuthError | Error | unknown): string => {
    if ((error as AuthError)?.message) {
      return (error as AuthError).message
    }
    return "An unexpected authentication error occurred"
  }

  const clearAuthAndRedirect = async () => {
    try {
      await supabaseClient.auth.signOut({ scope: 'local' })
      setUser(null)
    } catch (err) {
      console.error("Error during local sign out:", err)
    }
    router.push('/auth/login')
    router.refresh()
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return { success: false, error: signInError.message }
      }

      setUser(data.user)
      setError(null)
      return { success: true }
    } catch (err) {
      const errorMessage = handleAuthError(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    try {
      setLoading(true)
      const { error: signUpError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: metadata }
      })

      if (signUpError) {
        setError(signUpError.message)
        return { success: false, error: signUpError.message }
      }

      return { success: true }
    } catch (err) {
      const errorMessage = handleAuthError(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabaseClient.auth.signOut()
      setUser(null)
    } catch (err) {
      console.error("Error signing out:", err)
      setError(handleAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        return { success: false, error: resetError.message }
      }

      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link",
      })
      return { success: true }
    } catch (err) {
      const errorMessage = handleAuthError(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authInitialized && error && error.includes("Auth session missing")) {
      toast({
        title: "Authentication error",
        description: "Please sign in again to continue.",
        variant: "destructive",
      })
    }
  }, [authInitialized, error, toast])

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        clearAuthAndRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 