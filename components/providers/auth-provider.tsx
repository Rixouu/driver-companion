"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, AuthError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
  resetPassword: async () => ({ success: false }),
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    let isAuthenticated = false;
    
    const getUser = async () => {
      try {
        setLoading(true)
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error("Error fetching user:", error.message)
          setError(error.message)
          isAuthenticated = false;
        } else {
          setUser(user)
          setError(null)
          isAuthenticated = !!user;
        }
      } catch (err) {
        console.error("Unexpected error:", err)
        setError("An unexpected error occurred")
        isAuthenticated = false;
      } finally {
        setLoading(false)
      }
    }

    // Only set up auth state change listener if we're in a browser environment
    let subscription: { unsubscribe: () => void } | null = null;
    
    if (typeof window !== 'undefined') {
      getUser();
      
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        // Only update user if we have a valid session or we're signing out
        if (session?.user || event === 'SIGNED_OUT') {
          setUser(session?.user ?? null)
          
          if (event === 'SIGNED_IN') {
            toast({
              title: "Signed in successfully",
              description: `Welcome${session?.user?.email ? ` ${session.user.email}` : ''}!`,
            })
            isAuthenticated = true;
          } else if (event === 'SIGNED_OUT') {
            toast({
              title: "Signed out",
              description: "You have been signed out successfully.",
            })
            isAuthenticated = false;
          }
          
          router.refresh()
        }
      });
      
      subscription = data.subscription;
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [router, toast])

  const handleAuthError = (error: AuthError | Error | unknown): string => {
    if ((error as AuthError)?.message) {
      return (error as AuthError).message
    }
    return "An unexpected authentication error occurred"
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
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

  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      })

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
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
      await supabase.auth.signOut()
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
} 