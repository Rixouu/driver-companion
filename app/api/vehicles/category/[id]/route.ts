import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { AppError, AuthenticationError, DatabaseError } from "@/lib/errors/app-error"
import { handleApiError } from "@/lib/errors/error-handler"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AuthenticationError('User not authenticated to fetch vehicles.')
    }

    const categoryId = params.id

    // Get vehicles for this category using the junction table
    const { data: vehicles, error: queryError } = await supabase
      .from('pricing_category_vehicles')
      .select(`
        vehicle_id,
        vehicles (
          id,
          name,
          brand,
          model,
          year,
          plate_number,
          status,
          created_at,
          updated_at
        )
      `)
      .eq('category_id', categoryId)

    if (queryError) {
      throw new DatabaseError('Error fetching vehicles for category.', { cause: queryError })
    }

    // Extract the vehicle data from the join
    const categoryVehicles = vehicles
      ?.map(item => item.vehicles)
      .filter(Boolean) || []

    return NextResponse.json({
      vehicles: categoryVehicles,
      count: categoryVehicles.length
    })

  } catch (error) {
    console.error('[GET /api/vehicles/category/[id]] Error:', error)
    if (error instanceof AppError) return handleApiError(error)
    return handleApiError(new AppError('An unexpected error occurred while fetching vehicles for category.', 500, { cause: error instanceof Error ? error : undefined, isOperational: true }))
  }
}
