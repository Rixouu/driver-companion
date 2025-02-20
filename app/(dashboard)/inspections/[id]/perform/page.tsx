import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { InspectionForm } from "@/components/inspections/form/inspection-form"

interface PerformInspectionPageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: "Perform Inspection",
  description: "Perform a vehicle inspection",
}

export default async function PerformInspectionPage({ params }: PerformInspectionPageProps) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: inspection } = await supabase
    .from('inspections')
    .select(`
      *,
      vehicle:vehicles (*)
    `)
    .eq('id', params.id)
    .single()

  if (!inspection || (inspection.status !== 'scheduled' && inspection.status !== 'in_progress')) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {inspection.status === 'in_progress' ? 'Continue Inspection' : 'Perform Inspection'}
        </h1>
        <p className="text-muted-foreground">
          {inspection.status === 'in_progress' 
            ? `Continue inspection for ${inspection.vehicle.name}`
            : `Perform inspection for ${inspection.vehicle.name}`
          }
        </p>
      </div>
      <InspectionForm inspectionId={inspection.id} vehicle={inspection.vehicle} />
    </div>
  )
} 