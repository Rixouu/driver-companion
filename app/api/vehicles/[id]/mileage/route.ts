import { NextRequest, NextResponse } from "next/server"
import { Database } from "@/types/supabase"
import { handleApiError } from "@/lib/errors/error-handler"
import { AppError, AuthenticationError, DatabaseError, ValidationError } from "@/lib/errors/app-error"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Helper to validate UUID (copied from app/api/pricing/service-types/[id]/route.ts or similar)
function isValidUUID(uuid: string) {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const vehicleId = params.id;
  try {
    if (!isValidUUID(vehicleId)) {
      throw new ValidationError('Invalid Vehicle ID format.');
    }

    const supabase = await getSupabaseServerClient()

    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      const cause = authError instanceof Error ? authError : undefined;
      throw new AuthenticationError('Authentication failed to get mileage entries.', undefined, { cause })
    }

    const searchParams = request.nextUrl.searchParams
    const pageParam = searchParams.get("page")
    const pageSizeParam = searchParams.get("pageSize")

    const page = pageParam ? parseInt(pageParam, 10) : 1
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 10

    if (isNaN(page) || page < 1) {
      throw new ValidationError("Invalid page number. Page must be 1 or greater.", { page: 'Must be a positive integer' })
    }
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new ValidationError("Invalid page size. Page size must be between 1 and 100.", { pageSize: 'Must be between 1 and 100' })
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: logs, error: dbError, count } = await supabase
      .from("mileage_entries")
      .select("id, date, reading, notes, vehicle_id", { count: "exact" })
      .eq("vehicle_id", vehicleId)
      .order("date", { ascending: false })
      .range(from, to)

    if (dbError) {
      throw new DatabaseError('Failed to fetch mileage entries.', { cause: dbError })
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / pageSize)

    return NextResponse.json({
      data: logs || [],
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    })
  } catch (error) {
    console.error(`[GET /api/vehicles/${vehicleId}/mileage] Error:`, error)
    if (error instanceof AppError) return handleApiError(error)
    return handleApiError(new AppError('Unexpected error fetching mileage entries.', 500, { cause: error instanceof Error ? error : undefined, isOperational: true }))
  }
} 