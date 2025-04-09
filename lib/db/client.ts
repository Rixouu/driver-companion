import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Create a single instance
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance
  
  supabaseInstance = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return supabaseInstance
})()

export function getSupabaseClient() {
  return supabase
} 