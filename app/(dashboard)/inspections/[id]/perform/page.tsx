import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { InspectionForm } from "@/components/inspections/inspection-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link
              href={`/inspections/${params.id}`}
              className="flex items-center gap-2"
              legacyBehavior>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to inspection details</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {inspection.status === 'in_progress' ? 'Continue Inspection' : 'Perform Inspection'}
            </h1>
            <p className="text-muted-foreground">
              {inspection.status === 'in_progress' 
                ? `Continue inspection for ${inspection.vehicle.name}`
                : `Perform inspection for ${inspection.vehicle.name}`
              }
            </p>
          </div>
        </div>

        <InspectionForm 
          inspectionId={inspection.id} 
          type={inspection.type} 
          vehicleId={inspection.vehicle.id} 
        />
      </div>
    </div>
  );
} 