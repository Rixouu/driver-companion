import { Metadata } from "next"
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

  // Use regular Supabase query instead of problematic RPC function
  console.log("Server  Using regular Supabase query for inspections")
  
  // First, get ALL inspections without any joins to ensure we get everything
  const { data: allInspections, error: allInspectionsError } = await supabase
    .from('inspections')
    .select('*')
    .order('created_at', { ascending: false })
  
  console.log("Server  All inspections count:", allInspections?.length || 0)
  
  // Then get the paginated subset with joins
  const { data: inspectionsData, error: inspectionsError } = await supabase
    .from('inspections')
    .select(`
      *,
      vehicles(name, plate_number, brand, model, year),
      drivers(id, first_name, last_name, email, user_id)
    `)
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)

  // For calendar view, we need ALL inspections, not just paginated ones
  const { data: allInspectionsWithJoins, error: allJoinsError } = await supabase
    .from('inspections')
    .select(`
      *,
      vehicles(name, plate_number, brand, model, year),
      drivers(id, first_name, last_name, email, user_id)
    `)
    .order('created_at', { ascending: false })

  // Get inspector data separately since there's no foreign key constraint
  let inspectorData: any = {}
  
  // Get inspector IDs from both paginated and full datasets
  const allInspectorIds = new Set<string>()
  
  if (inspectionsData && inspectionsData.length > 0) {
    inspectionsData.forEach(i => {
      if (i.inspector_id) allInspectorIds.add(i.inspector_id)
    })
  }
  
  if (allInspectionsWithJoins && allInspectionsWithJoins.length > 0) {
    allInspectionsWithJoins.forEach(i => {
      if (i.inspector_id) allInspectorIds.add(i.inspector_id)
    })
  }
  
  if (allInspectorIds.size > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', Array.from(allInspectorIds))
    
    if (profilesData) {
      inspectorData = profilesData.reduce((acc, profile) => {
        acc[profile.id] = profile
        return acc
      }, {} as any)
    }
  }

  // Debug: Log what we're getting back
  console.log("Server  Supabase query response:", {
    data: inspectionsData,
    error: inspectionsError,
    dataType: typeof inspectionsData,
    isArray: Array.isArray(inspectionsData),
    dataLength: Array.isArray(inspectionsData) ? inspectionsData.length : 'not array'
  })

  // Transform the data to match OptimizedInspection structure
  let inspections: OptimizedInspection[] = []
  let totalCount = allInspections?.length || 0
  
  if (inspectionsData && Array.isArray(inspectionsData)) {
    inspections = inspectionsData.map(item => {
      // Get inspector data from profiles table (not drivers)
      const inspector = item.inspector_id ? inspectorData[item.inspector_id] : null
      
      return {
        id: item.id,
        date: item.date,
        status: item.status,
        type: item.type || 'routine',
        vehicle_id: item.vehicle_id,
        inspector_id: item.inspector_id,
        driver_id: item.driver_id, // Add driver_id
        created_by: item.created_by, // Add created_by for inspector filtering
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
        notes: item.notes,
        vehicle_name: item.vehicles?.name || '',
        vehicle_plate_number: item.vehicles?.plate_number || '',
        vehicle_brand: item.vehicles?.brand || null,
        vehicle_model: item.vehicles?.model || null,
        vehicle_year: item.vehicles?.year || null,
        inspector_name: inspector?.full_name || null,
        inspector_email: inspector?.email || null,
        driver_name: item.drivers ? `${item.drivers.first_name} ${item.drivers.last_name}` : null,
        driver_email: item.drivers?.email || null,
        template_display_name: item.type || 'routine',
        total_count: totalCount
      }
    })
  }

  // Also transform the full dataset for calendar view
  let allInspectionsTransformed: OptimizedInspection[] = []
  if (allInspectionsWithJoins && Array.isArray(allInspectionsWithJoins)) {
    allInspectionsTransformed = allInspectionsWithJoins.map(item => {
      // Get inspector data from profiles table (not drivers)
      const inspector = item.inspector_id ? inspectorData[item.inspector_id] : null
      
      return {
        id: item.id,
        date: item.date,
        status: item.status,
        type: item.type || 'routine',
        vehicle_id: item.vehicle_id,
        inspector_id: item.inspector_id,
        driver_id: item.driver_id, // Add driver_id
        created_by: item.created_by, // Add created_by for inspector filtering
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
        notes: item.notes,
        vehicle_name: item.vehicles?.name || '',
        vehicle_plate_number: item.vehicles?.plate_number || '',
        vehicle_brand: item.vehicles?.brand || null,
        vehicle_model: item.vehicles?.model || null,
        vehicle_year: item.vehicles?.year || null,
        inspector_name: inspector?.full_name || null,
        inspector_email: inspector?.email || null,
        driver_name: item.drivers ? `${item.drivers.first_name} ${item.drivers.last_name}` : null,
        driver_email: item.drivers?.email || null,
        template_display_name: item.type || 'routine',
        total_count: totalCount
      }
    })
  }

  // Get total count for pagination - use the actual count we got
  if (totalCount === 0) {
    const { count } = await supabase
      .from('inspections')
      .select('*', { count: 'exact', head: true })
    
    totalCount = count || 0
  }

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
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))
  const vehicles = ((vehiclesData || []) as unknown) as DbVehicle[]

  return (
    <div className="space-y-6">
      <InspectionList 
        inspections={inspections} 
        allInspections={allInspectionsTransformed}
        vehicles={vehicles}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  )
} 