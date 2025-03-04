import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get total fuel logs
    const { count: fuelLogsCount } = await db
      .from("fuel_logs")
      .select("*", { count: "exact", head: true })
      .eq("vehicle_id", params.id)

    // Get total mileage logs
    const { count: mileageLogsCount } = await db
      .from("mileage_logs")
      .select("*", { count: "exact", head: true })
      .eq("vehicle_id", params.id)

    // Get total maintenance tasks
    const { count: maintenanceTasksCount } = await db
      .from("maintenance_tasks")
      .select("*", { count: "exact", head: true })
      .eq("vehicle_id", params.id)

    // Get total inspections
    const { count: inspectionsCount } = await db
      .from("inspections")
      .select("*", { count: "exact", head: true })
      .eq("vehicle_id", params.id)

    return NextResponse.json({
      fuelLogs: fuelLogsCount,
      mileageLogs: mileageLogsCount,
      maintenanceTasks: maintenanceTasksCount,
      inspections: inspectionsCount,
    })
  } catch (error) {
    console.error("Error fetching vehicle stats:", error)
    return new NextResponse("Error fetching vehicle stats", { status: 500 })
  }
} 