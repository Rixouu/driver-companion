import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { StepBasedInspectionForm } from "@/components/inspections/step-based/step-based-inspection-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getDictionary } from "@/lib/i18n/server"

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
  const { t } = await getDictionary()
  
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
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {isResuming ? t('inspections.editInspection') : (inspection.status === 'in_progress' ? t('inspections.continueInspection') : t('inspections.performInspection'))}
            </h1>
            <p className="text-muted-foreground">
              {isResuming 
                ? t('inspections.editingInspectionFor', { vehicleName: inspection.vehicle.name })
                : (inspection.status === 'in_progress' 
                  ? t('inspections.continueInspectionFor', { vehicleName: inspection.vehicle.name })
                  : t('inspections.performInspectionFor', { vehicleName: inspection.vehicle.name })
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