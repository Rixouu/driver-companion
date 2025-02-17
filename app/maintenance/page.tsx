import { Metadata } from "next"
import { MaintenanceList } from "@/components/maintenance/maintenance-list"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

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

  return (
    <div className="space-y-6">
      <MaintenanceList tasks={tasks || []} currentPage={1} totalPages={1} />
    </div>
  )
} 