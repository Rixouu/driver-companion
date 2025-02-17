import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(
  request: Request,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const { data, error } = await supabase
      .from("vehicle_assignments")
      .select(`
        *,
        driver:drivers(
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq("vehicle_id", params.vehicleId)
      .order("start_date", { ascending: false })

    if (error) throw error

    return NextResponse.json(
      data.map((assignment) => ({
        id: assignment.id,
        vehicleId: assignment.vehicle_id,
        driverId: assignment.driver_id,
        startDate: assignment.start_date,
        endDate: assignment.end_date,
        driverName: assignment.driver.name,
        driverEmail: assignment.driver.email,
        driverAvatar: assignment.driver.avatar_url,
      }))
    )
  } catch (error) {
    console.error("Failed to fetch assignments:", error)
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    )
  }
} 