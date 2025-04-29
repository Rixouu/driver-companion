import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import { MaintenanceForm } from "@/components/maintenance/maintenance-form"

export const metadata: Metadata = {
  title: "New Maintenance Task",
  description: "Create a new maintenance task",
}

type Priority = "high" | "medium" | "low"

// Helper function to validate priority
function validatePriority(priority: string | null): Priority {
  if (priority === "high" || priority === "low" || priority === "medium") {
    return priority
  }
  return "medium"
}

// Helper function to get search param value
function getSearchParam(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : ''
}

export default async function NewMaintenancePage({ 
  params, 
  searchParams 
}: { 
  params: { id: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Fetch vehicle details
  const supabase = createServerComponentClient({ cookies })
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('name')
    .eq('id', params.id)
    .single()
  
  const initialData = {
    vehicle_id: params.id,
    title: getSearchParam(searchParams.title),
    description: getSearchParam(searchParams.description),
    priority: validatePriority(getSearchParam(searchParams.priority)),
    due_date: getSearchParam(searchParams.due_date) || new Date().toISOString().split('T')[0],
    estimated_duration: getSearchParam(searchParams.estimated_duration),
    cost: getSearchParam(searchParams.cost),
    notes: getSearchParam(searchParams.notes),
    status: 'scheduled' as const
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link
            href={`/vehicles/${params.id}/maintenance`}
            className="flex items-center gap-2" ><span className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to maintenance</span>
            <span className="sm:hidden">Back</span>
          </span></Link>
        </Button>

        <p className="text-muted-foreground">
          Create a new maintenance task for {vehicle?.name}
        </p>
      </div>
      <MaintenanceForm initialData={initialData} />
    </div>
  );
} 