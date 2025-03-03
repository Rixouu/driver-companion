import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from "next/navigation"
import { NewMaintenancePageContent } from "@/components/maintenance/new-maintenance-page-content"

export default async function NewMaintenancePage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  return <NewMaintenancePageContent />
} 