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

const ITEMS_PER_PAGE = 20

export const metadata = {
  title: "Inspections",
  description: "Vehicle inspection management",
}

export const dynamic = "force-dynamic"

export default async function InspectionsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await getSupabaseServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User not authenticated, redirecting to login.")
    redirect('/login')
  }

  // Pagination
  const resolvedSearchParams = await searchParams
  const pageParam = Array.isArray(resolvedSearchParams?.page) ? resolvedSearchParams?.page[0] : resolvedSearchParams?.page
  const currentPage = Math.max(1, parseInt(String(pageParam || '1'), 10) || 1)
  const from = (currentPage - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  const { data: inspectionsData, error: inspectionsError, count } = await supabase
    .from('inspections')
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .range(from, to)

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
  const totalPages = Math.max(1, Math.ceil(((count as number) || 0) / ITEMS_PER_PAGE))

  return (
    <div className="space-y-6">
      <InspectionList 
        inspections={inspections} 
        vehicles={vehicles}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  )
} 