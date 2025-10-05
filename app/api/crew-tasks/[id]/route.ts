import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";

// =====================================================
// GET /api/crew-tasks/[id]
// Get a single crew task
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient();
    const { id } = await params;
    const body = await request.json();

    // Get current user for updated_by
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Skip conflict detection for updates - just update the task
    // Conflict detection can be added later with more sophisticated logic

    // Filter out calculated fields and invalid fields that don't exist in the database
    const { 
      current_day, 
      is_multi_day, 
      is_first_day, 
      is_last_day, 
      task_date,
      drivers, // Remove any drivers field that might be included
      driver_name, // Remove any driver_name field
      ...updateData 
    } = body;

    // Only include valid fields that exist in the crew_tasks table
    const validFields = {
      task_number: updateData.task_number,
      task_type: updateData.task_type,
      task_status: updateData.task_status,
      driver_id: updateData.driver_id,
      start_date: updateData.start_date,
      end_date: updateData.end_date,
      start_time: updateData.start_time,
      end_time: updateData.end_time,
      hours_per_day: updateData.hours_per_day,
      total_hours: updateData.total_hours,
      booking_id: updateData.booking_id,
      title: updateData.title,
      description: updateData.description,
      location: updateData.location,
      customer_name: updateData.customer_name,
      customer_phone: updateData.customer_phone,
      color_override: updateData.color_override,
      priority: updateData.priority,
      notes: updateData.notes,
    };

    // Remove undefined values
    const cleanFields = Object.fromEntries(
      Object.entries(validFields).filter(([_, value]) => value !== undefined)
    );

    // Update the task
    const { data, error } = await supabase
      .from("crew_tasks")
      .update({
        ...cleanFields,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient();
    const { id } = await params;

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

