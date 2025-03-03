import { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MaintenanceScheduleForm } from "@/components/maintenance/maintenance-schedule-form"

export const metadata: Metadata = {
  title: "Schedule Maintenance",
  description: "Schedule a new maintenance task",
}

export default async function ScheduleMaintenancePage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Fetch vehicles for the form
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .order('name')
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/maintenance" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to maintenance</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Schedule Maintenance Task
            </h1>
            <p className="text-muted-foreground">
              Schedule a new maintenance task by filling out the form below
            </p>
          </div>
        </div>

        <MaintenanceScheduleForm vehicles={vehicles || []} />
      </div>
    </div>
  )
} 