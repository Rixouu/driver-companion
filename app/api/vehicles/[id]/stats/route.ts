import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppError, AuthenticationError, DatabaseError, ValidationError } from "@/lib/errors/app-error";
import { handleApiError } from "@/lib/errors/error-handler";

// Helper to validate UUID (copied from app/api/pricing/service-types/[id]/route.ts)
function isValidUUID(uuid: string) {
  if (!uuid) return false; // Handle null or undefined early
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const vehicleId = params.id;
  try {
    if (!isValidUUID(vehicleId)) {
      throw new ValidationError('Invalid Vehicle ID format.');
    }

    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthenticationError('User not authenticated to fetch vehicle stats.');
    }
    
    const [fuelLogsResult, mileageLogsResult, maintenanceTasksResult, inspectionsResult] = await Promise.all([
      supabase.from("fuel_entries").select("*", { count: "exact", head: true }).eq("vehicle_id", vehicleId),
      supabase.from("mileage_entries").select("*", { count: "exact", head: true }).eq("vehicle_id", vehicleId),
      supabase.from("maintenance_tasks").select("*", { count: "exact", head: true }).eq("vehicle_id", vehicleId),
      supabase.from("inspections").select("*", { count: "exact", head: true }).eq("vehicle_id", vehicleId)
    ]);
    
    const errors = [
      fuelLogsResult.error,
      mileageLogsResult.error,
      maintenanceTasksResult.error,
      inspectionsResult.error
    ].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach(err => console.error('[GET /api/vehicles/[id]/stats] Query Error:', err));
      throw new DatabaseError('Failed to fetch some vehicle statistics.', { cause: errors[0] as Error });
    }

    return NextResponse.json({
      fuelLogs: fuelLogsResult.count || 0,
      mileageLogs: mileageLogsResult.count || 0,
      maintenanceTasks: maintenanceTasksResult.count || 0,
      inspections: inspectionsResult.count || 0,
    });

  } catch (error) {
    console.error(`[GET /api/vehicles/${vehicleId}/stats] Error:`, error);
    if (error instanceof AppError) return handleApiError(error);
    return handleApiError(new AppError('Unexpected error fetching vehicle stats.', 500, { cause: error instanceof Error ? error : undefined, isOperational: true }));
  }
} 