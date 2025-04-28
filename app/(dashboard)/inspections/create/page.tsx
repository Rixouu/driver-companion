import { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { StepBasedInspectionForm } from "@/components/inspections/step-based-inspection-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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
  const supabase = createServerComponentClient({ cookies })
  
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
  const backText = bookingId ? "Back to booking" : "Back to inspections"
  
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
            <Link href={backUrl} className="flex items-center gap-2" legacyBehavior>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{backText}</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Create New Inspection
            </h1>
            <p className="text-muted-foreground">
              Create a new inspection by filling out the form below
            </p>
          </div>
        </div>

        <StepBasedInspectionForm 
          inspectionId="" 
          vehicleId={vehicleId} 
          bookingId={bookingId}
          vehicles={vehicles || []}
        />
      </div>
    </div>
  );
} 