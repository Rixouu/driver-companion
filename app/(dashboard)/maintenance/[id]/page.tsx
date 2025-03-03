import { notFound } from "next/navigation"
import { MaintenanceDetails } from "@/components/maintenance/maintenance-details"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface MaintenancePageProps {
  params: {
    id: string
  }
}

export default async function MaintenancePage({ params }: MaintenancePageProps) {
  if (!params.id) {
    return notFound()
  }

  const supabase = createServerComponentClient({ cookies })

  const { data: task } = await supabase
    .from('maintenance_tasks')
    .select(`
      *,
      vehicle:vehicles (
        id,
        name,
        plate_number
      )
    `)
    .eq('id', params.id)
    .single()

  if (!task) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <MaintenanceDetails task={task} />
    </div>
  )
} 