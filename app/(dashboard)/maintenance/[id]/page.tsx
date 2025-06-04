import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { MaintenanceDetails } from "@/components/maintenance/maintenance-details"
import type { MaintenanceTask } from "@/types"

interface MaintenancePageProps {
  params: {
    id: string
  }
}

export default async function MaintenancePage(props: MaintenancePageProps) {
  if (!props.params.id) {
    return notFound()
  }

  const supabase = await getSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  const { data: task, error: taskError } = await supabase
    .from('maintenance_tasks')
    .select(`
      *,
      vehicle:vehicles (
        id,
        name,
        plate_number
      )
    `)
    .eq('id', props.params.id)
    .single()

  if (taskError || !task) {
    return notFound()
  }

  const taskData = {
    ...task,
    description: task.description === null ? undefined : task.description,
    vehicle: task.vehicle ? { ...task.vehicle } : undefined,
  } as MaintenanceTask;

  return (
    <div className="space-y-6">
      <MaintenanceDetails task={taskData} />
    </div>
  )
} 