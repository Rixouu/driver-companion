"use client"

import { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/index"

export function useAuth() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Skip if not in browser context
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }
    
    let ignore = false
    
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error("Auth error:", error.message)
          if (!ignore) setUser(null)
        } else if (!ignore) {
          setUser(user)
        }
      } catch (error) {
        console.error("Unexpected auth error:", error)
        if (!ignore) setUser(null)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) setUser(session?.user ?? null)
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
} 