import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { siteConfig } from '@/lib/config'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getSession() {
  // Use the updated Supabase client that handles cookies properly in Next.js 15
  const supabase = await createServerSupabaseClient();
  
  const { data: { session } } = await supabase.auth.getSession()
  return session
} 