import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ShiftScheduleParams {
  start_date: string;
  end_date: string;
  driver_ids?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const driverIdsParam = searchParams.getAll("driver_ids[]");
    
    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters: start_date and end_date" },
        { status: 400 }
      );
    }

    // Call the database function
    const { data, error } = await supabase.rpc("get_shift_schedule", {
      p_start_date: startDate,
      p_end_date: endDate,
      p_driver_ids: driverIdsParam.length > 0 ? driverIdsParam : null,
    });

    if (error) {
      console.error("Error fetching shift schedule:", error);
      return NextResponse.json(
        { error: "Failed to fetch shift schedule", details: error.message },
        { status: 500 }
      );
    }

    // Transform data for easier consumption
    const transformedData = transformShiftData(data);

    return NextResponse.json({
      success: true,
      data: transformedData,
      meta: {
        start_date: startDate,
        end_date: endDate,
        driver_count: transformedData.drivers.length,
        date_count: transformedData.dates.length,
      },
    });
  } catch (error) {
    console.error("Unexpected error in shift schedule API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Transform raw shift data into a more structured format
 */
function transformShiftData(rawData: any[]) {
  if (!rawData || rawData.length === 0) {
    return { drivers: [], dates: [], grid: {} };
  }

  // Extract unique drivers
  const driversMap = new Map();
  const datesSet = new Set<string>();

  rawData.forEach((row) => {
    // Add driver to map
    if (!driversMap.has(row.driver_id)) {
      driversMap.set(row.driver_id, {
        id: row.driver_id,
        name: row.driver_name,
      });
    }

    // Add date to set
    datesSet.add(row.shift_date);
  });

  const drivers = Array.from(driversMap.values());
  const dates = Array.from(datesSet).sort();

  // Create grid structure: { driverId: { date: { shifts, bookings } } }
  const grid: Record<string, Record<string, any>> = {};

  rawData.forEach((row) => {
    if (!grid[row.driver_id]) {
      grid[row.driver_id] = {};
    }

    grid[row.driver_id][row.shift_date] = {
      shifts: row.shifts || [],
      bookings: row.bookings || [],
      booking_count: row.bookings ? row.bookings.length : 0,
      total_hours: row.bookings
        ? row.bookings.reduce(
            (sum: number, b: any) => sum + (b.duration_hours || 0),
            0
          )
        : 0,
      total_revenue: row.bookings
        ? row.bookings.reduce(
            (sum: number, b: any) => sum + (b.price_amount || 0),
            0
          )
        : 0,
    };
  });

  return { drivers, dates, grid };
}

