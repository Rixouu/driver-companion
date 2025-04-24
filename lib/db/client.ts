import { supabase as supabaseClient } from '@/lib/supabase/client'

// Re-export the client from the singleton implementation
export const supabase = supabaseClient

export function getSupabaseClient() {
  return supabase
} 