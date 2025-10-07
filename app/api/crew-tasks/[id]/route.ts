import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";

// =====================================================
// GET /api/crew-tasks/[id]
// Get a single crew task
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient();
    const { id } = await params;

    // Check if this is a booking-prefixed ID
    if (id.startsWith('booking-')) {
      const bookingId = id.replace('booking-', '');
      
      // Fetch the booking data
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          *,
          drivers!bookings_driver_id_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .eq("id", bookingId)
        .single();

      if (bookingError) {
        console.error("Error fetching booking:", bookingError);
        return NextResponse.json(
          { error: bookingError.message },
          { status: 500 }
        );
      }

      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }

      // Convert booking to crew task format
      const crewTaskData = {
        id: id, // Keep the booking- prefix
        task_number: 1,
        task_type: "charter",
        task_status: "scheduled",
        driver_id: booking.driver_id,
        start_date: booking.date,
        end_date: booking.date,
        start_time: booking.time,
        end_time: booking.time ? (() => {
          const [hours, minutes] = booking.time.split(':').map(Number);
          const durationHours = booking.duration_hours || booking.hours_per_day || 1;
          const endHour = hours + Math.floor(durationHours);
          const endMinute = minutes + ((durationHours % 1) * 60);
          return `${endHour.toString().padStart(2, '0')}:${Math.floor(endMinute).toString().padStart(2, '0')}`;
        })() : null,
        hours_per_day: booking.duration_hours || booking.hours_per_day || 1,
        total_hours: booking.duration_hours || booking.hours_per_day || 1,
        booking_id: booking.id,
        title: booking.service_name || "Booking",
        description: `${booking.service_type} service`,
        location: booking.pickup_location,
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone,
        priority: 1,
        notes: `From booking ${booking.wp_id}`,
        drivers: booking.drivers,
        is_booking: true,
        price_amount: booking.price_amount
      };

      return NextResponse.json(crewTaskData);
    }

    // Regular crew task ID - fetch from crew_tasks table
    const { data, error } = await supabase
      .from("crew_tasks")
      .select(`
        *,
        drivers!crew_tasks_driver_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
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

    return NextResponse.json(data);
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

    // Check if this is a booking-prefixed ID
    if (id.startsWith('booking-')) {
      const bookingId = id.replace('booking-', '');
      
      // For booking tasks, update the booking instead
      const updateData: any = {};
      
      if (body.driver_id !== undefined) {
        updateData.driver_id = body.driver_id;
      }
      if (body.start_date !== undefined) {
        updateData.date = body.start_date;
      }
      if (body.start_time !== undefined) {
        updateData.time = body.start_time;
      }
      if (body.location !== undefined) {
        updateData.pickup_location = body.location;
      }
      if (body.customer_name !== undefined) {
        updateData.customer_name = body.customer_name;
      }
      if (body.customer_phone !== undefined) {
        updateData.customer_phone = body.customer_phone;
      }

      // Get current user for updated_by
      const {
        data: { user },
      } = await supabase.auth.getUser();

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId)
        .select()
        .single();

      if (error) {
        console.error("Error updating booking:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Booking updated successfully",
        data
      });
    }

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

    // If this task has a booking_id, sync changes back to the booking
    if (!error && data && data.booking_id) {
      // Import the sync service
      const { syncCrewTaskToBooking } = await import('@/lib/services/crew-task-booking-sync');
      
      // Prepare the fields that might need syncing
      const syncFields = {
        driver_id: cleanFields.driver_id,
        start_date: cleanFields.start_date,
        start_time: cleanFields.start_time,
        location: cleanFields.location,
        customer_name: cleanFields.customer_name,
        customer_phone: cleanFields.customer_phone,
      };

      // Remove undefined values
      const syncFieldsFiltered = Object.fromEntries(
        Object.entries(syncFields).filter(([_, value]) => value !== undefined)
      );

      // Only sync if there are fields to sync
      if (Object.keys(syncFieldsFiltered).length > 0) {
        const syncResult = await syncCrewTaskToBooking(
          id,
          data.booking_id,
          syncFieldsFiltered,
          user?.id
        );

        if (!syncResult.success) {
          console.warn('Failed to sync task changes to booking:', syncResult.errors);
        }
      }
    }

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

