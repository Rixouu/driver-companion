import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";

// =====================================================
// GET /api/crew-tasks/unassigned
// Fetch unassigned crew tasks
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    
    // Build query for unassigned tasks
    // Tasks with NULL driver_id (clean approach)
    let query = supabase
      .from("crew_tasks")
      .select("*")
      .is("driver_id", null)
      .not("task_status", "in", "(cancelled,completed)");
    
    // Filter by date range if provided
    if (startDate && endDate) {
      query = query.or(`start_date.lte.${endDate},end_date.gte.${startDate}`);
    }
    
    // Order by start_date
    query = query.order("start_date", { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching unassigned tasks:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      tasks: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error("Unexpected error in GET /api/crew-tasks/unassigned:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

