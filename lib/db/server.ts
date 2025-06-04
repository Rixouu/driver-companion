// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
// import { siteConfig } from '@/lib/config'
import { createServerClient } from '@/lib/supabase/index'

export async function getSession() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    // It's good practice to log the error, but for getSession, we often just want to return null if no user
    console.error('[getSession] Error fetching user:', error.message);
    return null;
  }
  
  return user;
} 