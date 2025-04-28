import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { siteConfig } from '@/lib/config'

export async function getSession() {
  const cookieStore = await cookies()
  
  const supabase = createServerComponentClient<Database>({ 
    cookies: () => cookieStore
  })

  const { data: { session } } = await supabase.auth.getSession()
  return session
} 