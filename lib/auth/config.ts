import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/index'
import type { User } from '@supabase/supabase-js'

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting user in getSession (auth/config):', error.message)
      return null
    }
    return user
  } catch (error) {
    console.error('Exception in getSession (auth/config):', error)
    return null
  }
} 