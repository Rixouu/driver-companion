import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// =====================================================
// GET /api/crew-tasks/[id]
// Get a single crew task
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { id } = params;

    const { data, error } = await supabase
      .from("crew_task_schedule_view")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching crew task:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Unexpected error in GET /api/crew-tasks/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// =====================================================
// PATCH /api/crew-tasks/[id]
// Update a crew task
// =====================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { id } = params;
    const body = await request.json();

    // Get current user for updated_by
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If changing dates/times, check for conflicts
    if (body.driver_id || body.start_date || body.end_date || body.start_time || body.end_time) {
      // Get current task to compare
      const { data: currentTask } = await supabase
        .from("crew_tasks")
        .select("driver_id, start_date, end_date, start_time, end_time")
        .eq("id", id)
        .single();

      if (currentTask) {
        const { data: conflicts } = await supabase.rpc("check_driver_task_conflicts", {
          p_driver_id: body.driver_id || currentTask.driver_id,
          p_start_date: body.start_date || currentTask.start_date,
          p_end_date: body.end_date || currentTask.end_date,
          p_start_time: body.start_time !== undefined ? body.start_time : currentTask.start_time,
          p_end_time: body.end_time !== undefined ? body.end_time : currentTask.end_time,
          p_exclude_task_id: id,
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
      }
    }

    // Update the task
    const { data, error } = await supabase
      .from("crew_tasks")
      .update({
        ...body,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating crew task:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Task updated successfully",
    });
  } catch (error: any) {
    console.error("Unexpected error in PATCH /api/crew-tasks/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE /api/crew-tasks/[id]
// Delete a crew task
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { id } = params;

    const { error } = await supabase
      .from("crew_tasks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting crew task:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error: any) {
    console.error("Unexpected error in DELETE /api/crew-tasks/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

