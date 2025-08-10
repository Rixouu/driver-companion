import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { StepBasedInspectionForm } from "@/components/inspections/step-based-inspection-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface PerformInspectionPageProps {
  params: {
    id: string
  },
  searchParams: { [key: string]: string | string[] | undefined }
}

export const metadata: Metadata = {
  title: "Perform Inspection",
  description: "Perform a vehicle inspection",
}

export default async function PerformInspectionPage({ 
  params,
  searchParams
}: PerformInspectionPageProps) {
  const supabase = await getSupabaseServerClient()
  
  // Properly await the parameters
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const id = resolvedParams.id;
  
  // Check for resume parameter
  const isResuming = resolvedSearchParams.resume === 'true';
  
  const { data: inspection } = await supabase
    .from('inspections')
    .select(`
      *,
      vehicle:vehicles (*)
    `)
    .eq('id', id)
    .single()

  // Allow completed inspections if resume=true query parameter is provided
  if (!inspection || (inspection.status !== 'scheduled' && inspection.status !== 'in_progress' && !(isResuming && ['completed', 'failed'].includes(inspection.status)))) {
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
              href={`/inspections/${id}`}
              className="flex items-center gap-2" ><span className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to inspection details</span>
              <span className="sm:hidden">Back</span>
            </span></Link>
          </Button>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {isResuming ? 'Edit Inspection' : (inspection.status === 'in_progress' ? 'Continue Inspection' : 'Perform Inspection')}
            </h1>
            <p className="text-muted-foreground">
              {isResuming 
                ? `Editing inspection for ${inspection.vehicle.name}`
                : (inspection.status === 'in_progress' 
                  ? `Continue inspection for ${inspection.vehicle.name}`
                  : `Perform inspection for ${inspection.vehicle.name}`
                )
              }
            </p>
          </div>
        </div>

        <StepBasedInspectionForm 
          inspectionId={inspection.id}
          vehicleId={inspection.vehicle.id}
          vehicles={[inspection.vehicle as any]}
          isResuming={isResuming}
        />
      </div>
    </div>
  );
} 