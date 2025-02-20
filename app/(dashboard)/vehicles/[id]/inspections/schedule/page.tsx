import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { ScheduleInspectionForm } from "@/components/forms/schedule-inspection-form"

interface ScheduleInspectionPageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: "Schedule Inspection",
  description: "Schedule a new vehicle inspection",
}

export default async function ScheduleInspectionPage({ params }: ScheduleInspectionPageProps) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!vehicle) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Schedule Inspection</h1>
        <p className="text-muted-foreground">
          Schedule a new inspection for {vehicle.name}
        </p>
      </div>

      <div className="grid gap-6">
        <ScheduleInspectionForm vehicleId={vehicle.id} />
      </div>
    </div>
  )
} 