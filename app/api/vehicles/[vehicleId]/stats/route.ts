import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { addMonths, format, isAfter } from "date-fns"

export async function GET(
  request: Request,
  { params }: { params: { vehicleId: string } }
) {
  try {
    // Get latest mileage reading
    const { data: latestMileage } = await supabase
      .from("mileage_entries")
      .select("reading")
      .eq("vehicle_id", params.vehicleId)
      .order("date", { ascending: false })
      .limit(1)
      .single()

    // Get fuel efficiency data
    const { data: fuelEntries } = await supabase
      .from("fuel_entries")
      .select("liters, mileage")
      .eq("vehicle_id", params.vehicleId)
      .order("date", { ascending: true })

    // Calculate average fuel efficiency
    let totalDistance = 0
    let totalLiters = 0
    fuelEntries?.forEach((entry: any, index: number) => {
      if (index > 0) {
        const distance = entry.mileage - fuelEntries[index - 1].mileage
        totalDistance += distance
        totalLiters += entry.liters
      }
    })
    const avgFuelEfficiency = totalDistance / totalLiters

    // Get maintenance costs
    const { data: maintenanceTasks } = await supabase
      .from("maintenance_tasks")
      .select("cost")
      .eq("vehicle_id", params.vehicleId)
      .not("cost", "is", null)

    const totalMaintenanceCost = maintenanceTasks?.reduce(
      (sum, task) => sum + (task.cost || 0),
      0
    ) || 0

    // Get next service due
    const { data: serviceSchedules } = await supabase
      .from("service_schedules")
      .select("*")
      .eq("vehicle_id", params.vehicleId)

    let nextServiceDue = "No service scheduled"
    serviceSchedules?.forEach((schedule) => {
      if (schedule.last_service_date) {
        const nextDueDate = addMonths(
          new Date(schedule.last_service_date),
          schedule.interval_months || 0
        )
        if (isAfter(nextDueDate, new Date())) {
          nextServiceDue = format(nextDueDate, "MMM d, yyyy")
        }
      }
    })

    return NextResponse.json({
      totalMileage: latestMileage?.reading || 0,
      avgFuelEfficiency: avgFuelEfficiency || 0,
      totalMaintenanceCost,
      nextServiceDue,
    })
  } catch (error) {
    console.error("Failed to fetch vehicle stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch vehicle stats" },
      { status: 500 }
    )
  }
} 