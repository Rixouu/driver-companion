import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { syncBookingToShifts } from "@/lib/services/booking-sync";

/**
 * Manual sync endpoint to sync all bookings to shifts
 * This can be called to sync existing bookings that weren't automatically synced
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    
    // Get all bookings that have a driver assigned but no corresponding crew task
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        wp_id,
        driver_id,
        date,
        time,
        service_name,
        service_type,
        pickup_location,
        dropoff_location,
        customer_name,
        customer_phone,
        duration_hours,
        service_days,
        hours_per_day,
        status
      `)
      .not('driver_id', 'is', null)
      .eq('status', 'confirmed');

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        message: 'No bookings found to sync',
        synced: 0
      });
    }

    const results = [];
    const errors = [];

    for (const booking of bookings) {
      try {
        const syncResult = await syncBookingToShifts(booking.id);
        
        results.push({
          booking_id: booking.id,
          wp_id: booking.wp_id,
          success: syncResult.success,
          tasks_created: syncResult.tasksCreated,
          errors: syncResult.errors
        });

        if (!syncResult.success) {
          errors.push({
            booking_id: booking.id,
            wp_id: booking.wp_id,
            errors: syncResult.errors
          });
        }

      } catch (error) {
        console.error(`Error syncing booking ${booking.wp_id}:`, error);
        errors.push({
          booking_id: booking.id,
          wp_id: booking.wp_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const totalTasksCreated = results.reduce((sum, result) => sum + result.tasks_created, 0);
    const successfulSyncs = results.filter(r => r.success).length;

    return NextResponse.json({
      message: `Sync completed. ${successfulSyncs}/${bookings.length} bookings synced successfully`,
      total_bookings: bookings.length,
      successful_syncs: successfulSyncs,
      total_tasks_created: totalTasksCreated,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in manual booking sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check sync status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    
    // Get statistics
    const { data: bookingStats } = await supabase
      .from('bookings')
      .select('id, driver_id, status')
      .not('driver_id', 'is', null)
      .eq('status', 'confirmed');

    const { data: taskStats } = await supabase
      .from('crew_tasks')
      .select('id, booking_id, task_type')
      .not('booking_id', 'is', null);

    const bookingsWithTasks = taskStats?.filter(task => task.booking_id).length || 0;
    const totalBookings = bookingStats?.length || 0;
    const unsyncedBookings = totalBookings - bookingsWithTasks;

    return NextResponse.json({
      total_bookings: totalBookings,
      synced_bookings: bookingsWithTasks,
      unsynced_bookings: unsyncedBookings,
      sync_percentage: totalBookings > 0 ? Math.round((bookingsWithTasks / totalBookings) * 100) : 0
    });

  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
