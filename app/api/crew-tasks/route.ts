import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// =====================================================
// GET /api/crew-tasks
// Fetch crew task schedule for date range
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const driverIdsParam = searchParams.get("driver_ids");
    const taskNumbersParam = searchParams.get("task_numbers");

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "start_date and end_date are required" },
        { status: 400 }
      );
    }

    // Parse array parameters
    const driverIds = driverIdsParam
      ? driverIdsParam.split(",").filter(Boolean)
      : null;
    const taskNumbers = taskNumbersParam
      ? taskNumbersParam.split(",").map(Number).filter(n => !isNaN(n))
      : null;

    // Call the database function
    const { data, error } = await supabase.rpc("get_crew_task_schedule", {
      p_start_date: startDate,
      p_end_date: endDate,
      p_driver_ids: driverIds,
      p_task_numbers: taskNumbers,
    });

    if (error) {
      console.error("Error fetching crew task schedule:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform the data into a more usable format
    const schedule: Record<string, any> = {};
    
    if (data && Array.isArray(data)) {
      data.forEach((row: any) => {
        const driverId = row.driver_id;
        if (!schedule[driverId]) {
          schedule[driverId] = {
            driver_id: row.driver_id,
            driver_name: row.driver_name,
            dates: {},
          };
        }
        
        schedule[driverId].dates[row.task_date] = {
          tasks: Array.isArray(row.tasks) ? row.tasks : JSON.parse(row.tasks || "[]"),
          task_count: Array.isArray(row.tasks) ? row.tasks.length : JSON.parse(row.tasks || "[]").length,
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: Object.values(schedule),
      meta: {
        start_date: startDate,
        end_date: endDate,
        driver_count: Object.keys(schedule).length,
      },
    });
  } catch (error: any) {
    console.error("Unexpected error in GET /api/crew-tasks:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/crew-tasks
// Create a new crew task
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();

    // Validate required fields
    const {
      task_number,
      task_type = "regular",
      driver_id,
      start_date,
      end_date,
      start_time,
      end_time,
      hours_per_day,
      total_hours,
      title,
      description,
      location,
      customer_name,
      customer_phone,
      booking_id,
      color_override,
      priority = 0,
      notes,
    } = body;

    if (!task_number || !driver_id || !start_date || !end_date) {
      return NextResponse.json(
        {
          error: "task_number, driver_id, start_date, and end_date are required",
        },
        { status: 400 }
      );
    }

    // Check for conflicts
    const { data: conflicts } = await supabase.rpc("check_driver_task_conflicts", {
      p_driver_id: driver_id,
      p_start_date: start_date,
      p_end_date: end_date,
      p_start_time: start_time || null,
      p_end_time: end_time || null,
      p_exclude_task_id: null,
    });

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Driver has conflicting tasks in this date/time range",
          conflicts,
        },
        { status: 409 }
      );
    }

    // Get current user for created_by
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Insert the task
    const { data, error } = await supabase
      .from("crew_tasks")
      .insert({
        task_number,
        task_type,
        task_status: "scheduled",
        driver_id,
        start_date,
        end_date,
        start_time: start_time || null,
        end_time: end_time || null,
        hours_per_day: hours_per_day || null,
        total_hours: total_hours || null,
        booking_id: booking_id || null,
        title: title || null,
        description: description || null,
        location: location || null,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        color_override: color_override || null,
        priority,
        notes: notes || null,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating crew task:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Task created successfully",
    });
  } catch (error: any) {
    console.error("Unexpected error in POST /api/crew-tasks:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

