import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - List shifts with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const driverId = searchParams.get("driver_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const status = searchParams.get("status");
    
    let query = supabase
      .from("driver_shifts")
      .select(`
        *,
        driver:drivers!driver_shifts_driver_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        created_by_user:profiles!driver_shifts_created_by_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .order("shift_date", { ascending: true })
      .order("shift_start_time", { ascending: true });

    // Apply filters
    if (driverId) {
      query = query.eq("driver_id", driverId);
    }
    if (startDate) {
      query = query.gte("shift_date", startDate);
    }
    if (endDate) {
      query = query.lte("shift_date", endDate);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching shifts:", error);
      return NextResponse.json(
        { error: "Failed to fetch shifts", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Unexpected error in shifts GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new shift
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      driver_id,
      shift_date,
      shift_start_time,
      shift_end_time,
      shift_type = "regular",
      status = "scheduled",
      notes,
    } = body;

    // Validate required fields
    if (!driver_id || !shift_date || !shift_start_time || !shift_end_time) {
      return NextResponse.json(
        { error: "Missing required fields: driver_id, shift_date, shift_start_time, shift_end_time" },
        { status: 400 }
      );
    }

    // Check for overlapping shifts
    const { data: existingShifts } = await supabase
      .from("driver_shifts")
      .select("*")
      .eq("driver_id", driver_id)
      .eq("shift_date", shift_date)
      .neq("status", "cancelled");

    if (existingShifts && existingShifts.length > 0) {
      // Check for time overlap
      const hasOverlap = existingShifts.some((shift) => {
        const existingStart = shift.shift_start_time;
        const existingEnd = shift.shift_end_time;
        
        // Check if times overlap
        return (
          (shift_start_time >= existingStart && shift_start_time < existingEnd) ||
          (shift_end_time > existingStart && shift_end_time <= existingEnd) ||
          (shift_start_time <= existingStart && shift_end_time >= existingEnd)
        );
      });

      if (hasOverlap) {
        return NextResponse.json(
          { error: "Shift overlaps with existing shift for this driver" },
          { status: 409 }
        );
      }
    }

    // Create the shift
    const { data, error } = await supabase
      .from("driver_shifts")
      .insert({
        driver_id,
        shift_date,
        shift_start_time,
        shift_end_time,
        shift_type,
        status,
        notes,
        created_by: user.id,
        updated_by: user.id,
      })
      .select(`
        *,
        driver:drivers!driver_shifts_driver_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .single();

    if (error) {
      console.error("Error creating shift:", error);
      return NextResponse.json(
        { error: "Failed to create shift", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Shift created successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in shifts POST API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

