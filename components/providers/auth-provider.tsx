"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, AuthError } from "@supabase/supabase-js"
import { supabase, getSupabaseClient, clearAuthState } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<{ success: boolean; error?: string }>
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

  useEffect(() => {
    const supabase = getSupabaseClient()
    let initialCheckDone = false; // Flag to track if initial check completed
    let retryCount = 0;
    const MAX_RETRIES = 2;
    
    // Call getUser once on initial load to attempt session fetch
    const getUser = async () => {
      console.log("[AuthProvider] Attempting initial getUser()...");
      try {
        const { data, error } = await supabase.auth.getUser()
        console.log("[AuthProvider] getUser() result:", data);

        if (!initialCheckDone) { // Only update state based on initial getUser if listener hasn't fired yet
             if (error) {
                 console.error("[AuthProvider] Initial getUser() error:", error.message);
                 // Don't set user to null here yet, wait for listener
                 setError(error.message);
                 
                 // If we get "Auth session missing" specifically, we may need to recover
                 if (error.message.includes("Auth session missing") && retryCount < MAX_RETRIES) {
                   console.log(`[AuthProvider] Attempting recovery (${retryCount + 1}/${MAX_RETRIES})...`);
                   retryCount++;
                   // Try to refresh the session
                   const { error: refreshError } = await supabase.auth.refreshSession();
                   if (refreshError) {
                     console.error("[AuthProvider] Session refresh failed:", refreshError);
                   } else {
                     console.log("[AuthProvider] Session refresh successful");
                     // Retry getUser
                     setTimeout(getUser, 500);
                     return;
                   }
                 }
             } else if (data.user) {
                 console.log("[AuthProvider] Initial getUser() success:", data.user);
                 setUser(data.user);
                 setError(null);
             }
        }
      } catch (err) {
        console.error("[AuthProvider] Unexpected error in initial getUser():", err)
        setError("An unexpected authentication error occurred");
      } finally {
        setAuthInitialized(true);
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
        setAuthInitialized(true);

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
             router.push('/auth/login');
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

  const clearAuthAndRedirect = async () => {
    await clearAuthState();
    router.push('/auth/login');
    router.refresh();
  };

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

  // Display an error message if there are auth initialization issues
  useEffect(() => {
    if (authInitialized && error && error.includes("Auth session missing")) {
      toast({
        title: "Authentication error",
        description: "Please sign in again to continue.",
        variant: "destructive",
      });
    }
  }, [authInitialized, error, toast]);

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
  return useContext(AuthContext)
} 