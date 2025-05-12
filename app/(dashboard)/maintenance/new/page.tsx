import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = "force-dynamic"

export default async function NewMaintenancePage() {
  // Use the function that properly handles cookies in Next.js
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Redirect to the schedule page
  redirect('/maintenance/schedule')
} 