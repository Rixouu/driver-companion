import { NextResponse } from "next/server"
import { createAPIClient, withErrorHandling, applyPagination, applySorting } from "@/lib/api/supabase-client"

export interface VehiclesRequestParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  statusFilter?: string
}

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    // Get query parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    const search = url.searchParams.get('search') || ''
    const statusFilter = url.searchParams.get('status') || ''
    
    const supabase = createAPIClient()
    
    // Build query
    let query = supabase
      .from("vehicles")
      .select(`
        id,
        name,
        make,
        model,
        year,
        license_plate,
        vin,
        status,
        created_at,
        updated_at
      `, { count: 'exact' })
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,license_plate.ilike.%${search}%,vin.ilike.%${search}%`)
    }
    
    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }
    
    // Get total count before pagination
    const { count: totalCount, error: countError } = await query
    
    if (countError) {
      throw countError
    }
    
    // Apply sorting and pagination
    query = applySorting(query, { sortBy, sortOrder })
    query = applyPagination(query, { page, pageSize })
    
    // Execute query
    const { data: vehicles, error } = await query
    
    if (error) {
      throw error
    }
    
    return {
      vehicles,
      pagination: {
        page,
        pageSize,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / pageSize)
      }
    }
  }, "Error fetching vehicles")
} 