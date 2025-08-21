import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { InspectionList } from "@/components/inspections/inspection-list"
import { redirect } from "next/navigation"
import type { OptimizedInspection } from "@/types"
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

  // Pagination and search parameters
  const resolvedSearchParams = await searchParams
  const pageParam = Array.isArray(resolvedSearchParams?.page) ? resolvedSearchParams?.page[0] : resolvedSearchParams?.page
  const currentPage = Math.max(1, parseInt(String(pageParam || '1'), 10) || 1)
  const statusFilter = String(resolvedSearchParams?.status || 'all')
  const searchQuery = String(resolvedSearchParams?.search || '')

  // Call the optimized RPC function for all inspection data
  const { data: inspectionsData, error: inspectionsError } = await supabase.rpc('get_inspections_with_details', {
    page_num: currentPage,
    page_size: ITEMS_PER_PAGE,
    status_filter: statusFilter,
    search_query: searchQuery
  })

  const inspections = (inspectionsData || []) as OptimizedInspection[]

  // Still need vehicles for the filter dropdown
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

  // Calculate total pages from the count returned by the RPC function
  const totalCount = (inspections?.[0]?.total_count as number) || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))
  const vehicles = ((vehiclesData || []) as unknown) as DbVehicle[]

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