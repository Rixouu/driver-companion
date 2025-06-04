import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { InspectionList } from "@/components/inspections/inspection-list"
import { redirect } from "next/navigation"
import type { DbInspection, Inspection } from "@/types"
import type { DbVehicle } from "@/types"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Suspense } from "react"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

const ITEMS_PER_PAGE = 9

export const metadata = {
  title: "Inspections",
  description: "Vehicle inspection management",
}

export const dynamic = "force-dynamic"

export default async function InspectionsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const supabase = await getSupabaseServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated, redirecting to login.")
    redirect('/login')
  }

  const { data: inspectionsData, error: inspectionsError } = await supabase
    .from('inspections')
    .select('*')
    .order('date', { ascending: false })

  const { data: vehiclesData, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('*')
    .order('name')

  if (inspectionsError) {
    console.error("Error fetching inspections:", inspectionsError.message)
  }
  if (vehiclesError) {
    console.error("Error fetching vehicles:", vehiclesError.message)
  }

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