import { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { MaintenancePageContent } from "@/components/maintenance/maintenance-page-content"

export const metadata: Metadata = {
  title: "Maintenance",
  description: "Vehicle maintenance management",
}

export default async function MaintenancePage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: tasks } = await supabase
    .from('maintenance_tasks')
    .select(`
      *,
      vehicle:vehicles (
        id,
        name,
        plate_number
      )
    `)
    .order('due_date', { ascending: true })

  return <MaintenancePageContent tasks={tasks || []} />
} 