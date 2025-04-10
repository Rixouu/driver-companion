import { createAPIClient, withErrorHandling } from "@/lib/api/supabase-client"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const supabase = createAPIClient()
    
    // Execute all queries concurrently for better performance
    const [fuelLogsResult, mileageLogsResult, maintenanceTasksResult, inspectionsResult] = await Promise.all([
      // Get total fuel entries
      supabase
        .from("fuel_entries")
        .select("*", { count: "exact", head: true })
        .eq("vehicle_id", params.id),
      
      // Get total mileage entries
      supabase
        .from("mileage_entries")
        .select("*", { count: "exact", head: true })
        .eq("vehicle_id", params.id),
      
      // Get total maintenance tasks
      supabase
        .from("maintenance_tasks")
        .select("*", { count: "exact", head: true })
        .eq("vehicle_id", params.id),
      
      // Get total inspections
      supabase
        .from("inspections")
        .select("*", { count: "exact", head: true })
        .eq("vehicle_id", params.id)
    ])
    
    // Handle query errors
    if (fuelLogsResult.error) throw fuelLogsResult.error
    if (mileageLogsResult.error) throw mileageLogsResult.error
    if (maintenanceTasksResult.error) throw maintenanceTasksResult.error
    if (inspectionsResult.error) throw inspectionsResult.error

    return {
      fuelLogs: fuelLogsResult.count || 0,
      mileageLogs: mileageLogsResult.count || 0,
      maintenanceTasks: maintenanceTasksResult.count || 0,
      inspections: inspectionsResult.count || 0,
    }
  }, "Error fetching vehicle stats")
} 