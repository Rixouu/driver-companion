"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, AuthError } from "@supabase/supabase-js"
import { supabase, getSupabaseClient } from "@/lib/supabase/client"
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
    const supabase = getSupabaseClient()
    let initialCheckDone = false; // Flag to track if initial check completed
    
    // Call getUser once on initial load to attempt session fetch
    const getUser = async () => {
      console.log("[AuthProvider] Attempting initial getUser()...");
      try {
        const { data, error } = await supabase.auth.getUser()
        console.log("[AuthProvider] getUser() result:", { data, error });

        if (!initialCheckDone) { // Only update state based on initial getUser if listener hasn't fired yet
             if (error) {
                 console.error("[AuthProvider] Initial getUser() error:", error.message);
                 // Don't set user to null here yet, wait for listener
                 // setError(error.message); // Optionally set error state
             } else {
                 console.log("[AuthProvider] Initial getUser() success:", data.user);
                 setUser(data.user);
             }
             // Don't set loading false here, let the listener handle it definitively
        }
      } catch (err) {
        console.error("[AuthProvider] Unexpected error in initial getUser():", err)
        // setError("An unexpected error occurred"); // Optionally set error state
      } 
    }
    
    getUser(); // Call it immediately

    // Listener handles subsequent changes and definitive initial state
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("[AuthProvider] onAuthStateChange event:", event, "session:", session);
        setUser(session?.user ?? null);
        setError(null); // Clear previous errors on auth change
        initialCheckDone = true; // Mark that the listener has given us the state
        setLoading(false); // Set loading false once we get the definitive state from the listener

        if (event === 'SIGNED_IN') {
            toast({
              title: "Signed in successfully",
              description: `Welcome${session?.user?.email ? ` ${session.user.email}` : ''}!`,
            })
            // router.refresh(); // Might not be needed if state update triggers re-render
        } else if (event === 'SIGNED_OUT') {
            toast({
              title: "Signed out",
              description: "You have been signed out successfully.",
            })
             // Redirect to login on sign out
             // router.push('/login'); // Or handle redirect elsewhere
        }
    });

    // Initial loading state - set true at the start
    setLoading(true);

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router, toast]); // Keep dependencies

  const handleAuthError = (error: AuthError | Error | unknown): string => {
    if ((error as AuthError)?.message) {
      return (error as AuthError).message
    }
    return "An unexpected authentication error occurred"
  }

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient()
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
    const supabase = getSupabaseClient()
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
    const supabase = getSupabaseClient()
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
    const supabase = getSupabaseClient()
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