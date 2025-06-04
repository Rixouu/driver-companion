export const dynamic = 'force-dynamic'
import { Metadata } from "next"
import { StepBasedInspectionForm } from "@/components/inspections/step-based-inspection-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getDictionary } from "@/lib/i18n/server"
import { PageHeader } from "@/components/page-header"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Suspense } from "react"
import { NewInspectionForm } from "@/components/inspections/new-inspection-form"

export const metadata: Metadata = {
  title: "Create Inspection",
  description: "Create a new vehicle inspection",
}

export default async function CreateInspectionPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await getSupabaseServerClient();
  const { t } = await getDictionary()
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // Extract parameters from the URL search params
  // const vehicleId = typeof searchParams.vehicleId === "string" ? searchParams.vehicleId : "";
  // const bookingId = typeof searchParams.bookingId === "string" ? searchParams.bookingId : "";
  
  // Fetch vehicles for the form
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .order('name')
  
  // const backUrl = bookingId ? `/bookings/${bookingId}` : "/inspections"
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('inspections.createNewInspection')}
        description={t('inspections.createNewInspectionDescription')}
      />

      <Suspense fallback={<div>Loading form...</div>}>
        <NewInspectionForm />
      </Suspense>
    </div>
  );
} 