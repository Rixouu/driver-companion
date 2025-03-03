import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from "next/navigation"
import { EditMaintenancePageContent } from "@/components/maintenance/edit-maintenance-page-content"

export default async function EditMaintenancePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: task } = await supabase
    .from('maintenance_tasks')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!task) {
    redirect('/maintenance')
  }

  return <EditMaintenancePageContent task={task} />
} 