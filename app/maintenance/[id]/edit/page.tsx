import { notFound } from "next/navigation"
import { MaintenanceForm } from "@/components/maintenance/maintenance-form"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface EditMaintenancePageProps {
  params: {
    id: string
  }
}

export default async function EditMaintenancePage({ params }: EditMaintenancePageProps) {
  const supabase = createServerComponentClient({ cookies })

  const { data: task } = await supabase
    .from('maintenance_tasks')
    .select(`
      id,
      vehicle_id,
      title,
      description,
      priority,
      due_date,
      status,
      estimated_duration,
      cost,
      notes
    `)
    .eq('id', params.id)
    .single()

  if (!task) {
    return notFound()
  }

  // Format the data for the form
  const formattedTask = {
    ...task,
    estimated_duration: task.estimated_duration?.toString(),
    cost: task.cost?.toString(),
    due_date: new Date(task.due_date).toISOString().split('T')[0],
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Maintenance Task</h1>
        <p className="text-muted-foreground">
          Update maintenance task details
        </p>
      </div>
      <MaintenanceForm 
        initialData={formattedTask}
        mode="edit" 
      />
    </div>
  )
} 