import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { InspectionList } from "@/components/inspections/inspection-list"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { InspectionPageContent } from "@/components/inspections/inspection-page-content"
import type { Database } from "@/types/supabase"

const ITEMS_PER_PAGE = 9

export const metadata = {
  title: "Inspections",
  description: "Vehicle inspection management",
}

export default async function InspectionsPage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Fetch inspections
  const { data: inspections } = await supabase
    .from('inspections')
    .select('*')
    .order('date', { ascending: false })

  // Fetch vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <InspectionList 
        inspections={inspections || []} 
        vehicles={vehicles || []}
      />
    </div>
  )
} 