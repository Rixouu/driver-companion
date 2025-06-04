import { NextRequest, NextResponse } from "next/server"
// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs" // Old import
import { createServerClient, type CookieOptions } from "@supabase/ssr" // New import for Route Handlers
import { cookies } from "next/headers"
import { Database } from "@/types/supabase"
import { handleApiError } from "@/lib/errors/error-handler"
import { AuthenticationError, DatabaseError, ValidationError } from "@/lib/errors/app-error"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const vehicleId = params.id;
    const supabase = await getSupabaseServerClient();

    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      throw new AuthenticationError(authError?.message || "Authentication failed", undefined, authError?.stack);
    }

    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 10;

    if (isNaN(page) || page < 1) {
      throw new ValidationError("Invalid page number. Page must be 1 or greater.");
    }
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new ValidationError("Invalid page size. Page size must be between 1 and 100.");
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: logs, error: dbError, count } = await supabase
      .from("fuel_entries")
      .select("id, date, odometer_reading, fuel_amount, fuel_cost, full_tank, vehicle_id", { count: "exact" })
      .eq("vehicle_id", vehicleId)
      .order("date", { ascending: false })
      .range(from, to);

    if (dbError) {
      throw new DatabaseError(dbError.message, dbError.stack);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      data: logs || [],
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    const params = await context.params;
    return handleApiError(error, { apiRoute: `/api/vehicles/${params.id}/fuel`, method: 'GET' });
  }
} 