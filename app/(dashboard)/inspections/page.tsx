import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { InspectionList } from "@/components/inspections/inspection-list"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { Database } from "@/types/supabase"
import type { DbInspection } from "@/types/inspections"
import type { Vehicle } from "@/types/vehicles"

const ITEMS_PER_PAGE = 9

export const metadata = {
  title: "Inspections",
  description: "Vehicle inspection management",
}

export default async function InspectionsPage() {
  // Explicitly await cookies before passing to the client creator
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

  // Fetch user session (Example of using the client)
  const { data: { session } } = await supabase.auth.getSession();

  // If no user, redirect to login
  if (!session) {
    redirect('/login') // Adjust login path if necessary
  }

  // Fetch inspections
  const { data: inspectionsData, error: inspectionsError } = await supabase
    .from('inspections')
    .select('*')
    .order('date', { ascending: false })

  // Fetch vehicles
  const { data: vehiclesData, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('*')
    .order('name')

  // Handle potential errors
  if (inspectionsError) {
    console.error("Error fetching inspections:", inspectionsError.message);
  }
  if (vehiclesError) {
    console.error("Error fetching vehicles:", vehiclesError.message);
  }

  // Corrected Type assertion/casting
  const inspections = (inspectionsData as any[] ?? []) as DbInspection[]
  const vehicles = (vehiclesData as any[] ?? []) as Vehicle[]

  return (
    <div className="space-y-6">
      <InspectionList 
        inspections={inspections} 
        vehicles={vehicles}
      />
    </div>
  )
} 