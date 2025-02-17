import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { startOfMonth, endOfMonth, format } from "date-fns"

export async function GET(
  request: Request,
  { params }: { params: { vehicleId: string } }
) {
  try {
    // Get fuel efficiency data
    const { data: fuelData, error: fuelError } = await supabase
      .from("fuel_entries")
      .select("date, liters, mileage")
      .eq("vehicle_id", params.vehicleId)
      .order("date", { ascending: true })

    if (fuelError) throw fuelError

    // Calculate fuel efficiency
    const fuelEfficiency = fuelData.map((entry: any, index: number) => {
      if (index === 0) return null
      const prevEntry = fuelData[index - 1]
      const distance = entry.mileage - prevEntry.mileage
      const efficiency = distance / entry.liters

      return {
        date: entry.date,
        kmPerLiter: efficiency,
      }
    }).filter(Boolean)

    // Get maintenance costs by month
    const { data: maintenanceData, error: maintenanceError } = await supabase
      .from("maintenance_tasks")
      .select("completed_date, cost")
      .eq("vehicle_id", params.vehicleId)
      .not("completed_date", "is", null)
      .order("completed_date", { ascending: true })

    if (maintenanceError) throw maintenanceError

    // Group maintenance costs by month
    const maintenanceCosts = maintenanceData.reduce((acc, entry) => {
      const month = format(new Date(entry.completed_date), "MMM yyyy")
      acc[month] = (acc[month] || 0) + entry.cost
      return acc
    }, {} as Record<string, number>)

    // Get vehicle utilization data
    const { data: assignmentData, error: assignmentError } = await supabase
      .from("vehicle_assignments")
      .select("start_date, end_date")
      .eq("vehicle_id", params.vehicleId)
      .order("start_date", { ascending: true })

    if (assignmentError) throw assignmentError

    // Calculate utilization rate by month
    const utilizationRate = assignmentData.reduce((acc, entry) => {
      const startDate = new Date(entry.start_date)
      const endDate = entry.end_date ? new Date(entry.end_date) : new Date()
      const month = format(startDate, "MMM yyyy")
      
      const daysInMonth = endOfMonth(startDate).getDate()
      const daysUsed = Math.min(
        endDate.getDate() - startDate.getDate() + 1,
        daysInMonth
      )

      acc[month] = (acc[month] || 0) + (daysUsed / daysInMonth)
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      fuelEfficiency,
      maintenanceCosts: Object.entries(maintenanceCosts).map(([month, cost]) => ({
        month,
        cost,
      })),
      utilizationRate: Object.entries(utilizationRate).map(([month, rate]) => ({
        month,
        rate,
      })),
    })
  } catch (error) {
    console.error("Failed to fetch vehicle statistics:", error)
    return NextResponse.json(
      { error: "Failed to fetch vehicle statistics" },
      { status: 500 }
    )
  }
} 