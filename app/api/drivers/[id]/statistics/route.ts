import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-client"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const driverId = params.id
    const supabase = createServiceClient()

    // Get completed bookings count
    const { data: completedBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id")
      .eq("driver_id", driverId)
      .eq("status", "completed")

    // Get total inspections count
    const { data: inspections, error: inspectionsError } = await supabase
      .from("inspections")
      .select("id")
      .eq("driver_id", driverId)

    // Get pending bookings count
    const { data: pendingBookings, error: pendingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("driver_id", driverId)
      .in("status", ["pending", "confirmed", "assigned"])

    if (bookingsError || inspectionsError || pendingError) {
      console.error("Database error:", { bookingsError, inspectionsError, pendingError })
    }

    // Calculate statistics
    const stats = {
      completedTrips: completedBookings?.length || 0,
      averageRating: 4.2 + Math.random() * 0.8, // Mock rating for now
      totalInspections: inspections?.length || 0,
      pendingBookings: pendingBookings?.length || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching driver statistics:", error)
    return NextResponse.json(
      { error: "Failed to fetch driver statistics" },
      { status: 500 }
    )
  }
} 