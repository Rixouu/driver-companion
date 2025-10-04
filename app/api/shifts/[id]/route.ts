import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET - Get a single shift by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id } = params;

    const { data, error } = await supabase
      .from("driver_shifts")
      .select(`
        *,
        driver:drivers!driver_shifts_driver_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone,
          profile_image_url
        ),
        created_by_user:profiles!driver_shifts_created_by_fkey(
          id,
          first_name,
          last_name
        ),
        updated_by_user:profiles!driver_shifts_updated_by_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching shift:", error);
      return NextResponse.json(
        { error: "Failed to fetch shift", details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Shift not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Unexpected error in shift GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update a shift
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id } = params;

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
      shift_start_time,
      shift_end_time,
      shift_type,
      status,
      notes,
    } = body;

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_by: user.id,
    };

    if (shift_start_time !== undefined) updateData.shift_start_time = shift_start_time;
    if (shift_end_time !== undefined) updateData.shift_end_time = shift_end_time;
    if (shift_type !== undefined) updateData.shift_type = shift_type;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Update the shift
    const { data, error } = await supabase
      .from("driver_shifts")
      .update(updateData)
      .eq("id", id)
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
      console.error("Error updating shift:", error);
      return NextResponse.json(
        { error: "Failed to update shift", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Shift updated successfully",
    });
  } catch (error) {
    console.error("Unexpected error in shift PATCH API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a shift
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id } = params;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Soft delete by setting status to cancelled
    const { error } = await supabase
      .from("driver_shifts")
      .update({
        status: "cancelled",
        updated_by: user.id,
      })
      .eq("id", id);

    if (error) {
      console.error("Error deleting shift:", error);
      return NextResponse.json(
        { error: "Failed to delete shift", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shift cancelled successfully",
    });
  } catch (error) {
    console.error("Unexpected error in shift DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

