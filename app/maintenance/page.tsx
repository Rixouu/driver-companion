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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">
            Schedule and track vehicle maintenance
          </p>
        </div>
        <Button asChild className="sm:flex-shrink-0">
          <Link href="/maintenance/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Maintenance
          </Link>
        </Button>
      </div>

      <MaintenanceList tasks={tasks || []} />
    </div>
  )
} 