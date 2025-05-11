import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { InspectionList } from "@/components/inspections/inspection-list"
import { redirect } from "next/navigation"
import type { DbInspection, Inspection } from "@/types"
import type { DbVehicle } from "@/types"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const ITEMS_PER_PAGE = 9

export const metadata = {
  title: "Inspections",
  description: "Vehicle inspection management",
}

export const dynamic = "force-dynamic"

export default async function InspectionsPage() {
  // Use the updated Supabase client that properly handles cookies in Next.js
  const supabase = await createServerSupabaseClient()

  // Fetch user session
  const { data: { session } } = await supabase.auth.getSession()

  // If no user, redirect to login
  if (!session) {
    redirect('/login')
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
    console.error("Error fetching inspections:", inspectionsError.message)
  }
  if (vehiclesError) {
    console.error("Error fetching vehicles:", vehiclesError.message)
  }

  // Cast data to the expected types using intermediate unknown cast
  const inspections = ((inspectionsData || []) as unknown) as Inspection[]
  const vehicles = ((vehiclesData || []) as unknown) as DbVehicle[]

  return (
    <div className="space-y-6">
      <InspectionList 
        inspections={inspections} 
        vehicles={vehicles}
      />
    </div>
  )
} 