import { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { StepBasedInspectionForm } from "@/components/inspections/step-based-inspection-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getDictionary } from "@/lib/i18n/server"
import { PageHeader } from "@/components/page-header"
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: "Create Inspection",
  description: "Create a new vehicle inspection",
}

interface CreateInspectionPageProps {
  searchParams?: {
    vehicleId?: string
    bookingId?: string
  }
}

export default async function CreateInspectionPage({ searchParams }: CreateInspectionPageProps) {
  const supabase = await createServerSupabaseClient();
  const { t } = await getDictionary()
  
  // Extract parameters from the URL search params
  const vehicleId = searchParams?.vehicleId || ""
  const bookingId = searchParams?.bookingId || ""
  
  // Fetch vehicles for the form
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .order('name')
  
  // Determine the back URL based on whether this was opened from a booking
  const backUrl = bookingId ? `/bookings/${bookingId}` : "/inspections"
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Inspection"
        description="Create a new inspection by filling out the form below"
      />

      <StepBasedInspectionForm 
        inspectionId="" 
        vehicleId={vehicleId} 
        bookingId={bookingId}
        vehicles={vehicles || []}
      />
    </div>
  );
} 