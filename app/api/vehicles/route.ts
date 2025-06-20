import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { applyPagination, applySorting } from "@/lib/api/supabase-client"
import { AppError, AuthenticationError, DatabaseError, ValidationError } from "@/lib/errors/app-error"
import { handleApiError } from "@/lib/errors/error-handler"

export interface VehiclesRequestParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  statusFilter?: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AuthenticationError('User not authenticated to fetch vehicles.')
    }

    const url = new URL(request.url)
    const pageParam = url.searchParams.get('page')
    const pageSizeParam = url.searchParams.get('pageSize')
    
    const page = pageParam ? parseInt(pageParam, 10) : 1
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 10

    if (isNaN(page) || page < 1) {
      throw new ValidationError('Invalid page number. Must be a positive integer.', { page: 'Must be a positive integer' })
    }
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new ValidationError('Invalid page size. Must be an integer between 1 and 100.', { pageSize: 'Must be an integer between 1 and 100' })
    }

    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const sortOrderInput = url.searchParams.get('sortOrder') || 'desc'
    const sortOrder = (sortOrderInput === 'asc' || sortOrderInput === 'desc') ? sortOrderInput : 'desc'
    
    const search = url.searchParams.get('search') || ''
    const statusFilter = url.searchParams.get('status') || ''
    
    let query = supabase
      .from("vehicles")
      .select(`
        id,
        name,
        brand,
        model,
        year,
        plate_number,
        vin,
        status,
        created_at,
        updated_at
      `, { count: 'exact' })
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,plate_number.ilike.%${search}%,vin.ilike.%${search}%`)
    }
    
    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }
    
    query = applySorting(query, { sortBy, sortOrder })
    query = applyPagination(query, { page, pageSize })
    
    const { data: vehicles, error: queryError, count: totalCount } = await query
    
    if (queryError) {
      throw new DatabaseError('Error fetching vehicles.', { cause: queryError })
    }
    
    return NextResponse.json({
      vehicles,
      pagination: {
        page,
        pageSize,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / pageSize)
      }
    })

  } catch (error) {
    console.error('[GET /api/vehicles] Error:', error)
    if (error instanceof AppError) return handleApiError(error)
    return handleApiError(new AppError('An unexpected error occurred while fetching vehicles.', 500, { cause: error instanceof Error ? error : undefined, isOperational: true }))
  }
} 