import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const driverId = searchParams.get("driver_id");
    const date = searchParams.get("date");
    const startTime = searchParams.get("start_time");
    const duration = searchParams.get("duration");
    
    // Validate required parameters
    if (!driverId || !date || !startTime || !duration) {
      return NextResponse.json(
        { error: "Missing required parameters: driver_id, date, start_time, duration" },
        { status: 400 }
      );
    }

    // Call the database function
    const { data, error } = await supabase.rpc("check_driver_availability", {
      p_driver_id: driverId,
      p_date: date,
      p_start_time: startTime,
      p_duration_hours: parseInt(duration, 10),
    });

    if (error) {
      console.error("Error checking driver availability:", error);
      return NextResponse.json(
        { error: "Failed to check availability", details: error.message },
        { status: 500 }
      );
    }

    const availability = data && data.length > 0 ? data[0] : null;

    return NextResponse.json({
      success: true,
      driver_id: driverId,
      date,
      start_time: startTime,
      duration_hours: parseInt(duration, 10),
      is_available: availability?.is_available || false,
      conflict_reason: availability?.conflict_reason || null,
      conflicts: availability?.conflicts || [],
    });
  } catch (error) {
    console.error("Unexpected error in availability check API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

