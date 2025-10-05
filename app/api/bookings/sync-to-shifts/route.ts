import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";

/**
 * Sync bookings to crew tasks (shifts)
 * This endpoint automatically creates crew tasks from bookings
 * Handles multi-day bookings by creating separate tasks for each day
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
        status,
        price_amount,
        vehicle_id
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

    const syncedTasks = [];
    const errors = [];

    for (const booking of bookings) {
      try {
        // Check if this booking already has crew tasks
        const { data: existingTasks } = await supabase
          .from('crew_tasks')
          .select('id')
          .eq('booking_id', booking.id);

        if (existingTasks && existingTasks.length > 0) {
          console.log(`Booking ${booking.wp_id} already has crew tasks, skipping`);
          continue;
        }

        // Calculate service details
        const serviceDays = booking.service_days || 1;
        const hoursPerDay = booking.hours_per_day || booking.duration_hours || 8;
        const startDate = new Date(booking.date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + serviceDays - 1);

        // Create crew tasks for each day of the service
        for (let dayOffset = 0; dayOffset < serviceDays; dayOffset++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(currentDate.getDate() + dayOffset);
          
          // Calculate start and end times for this day
          const startTime = booking.time || '09:00:00';
          const [hours, minutes] = startTime.split(':').map(Number);
          const startDateTime = new Date(currentDate);
          startDateTime.setHours(hours, minutes, 0, 0);
          
          const endDateTime = new Date(startDateTime);
          endDateTime.setHours(endDateTime.getHours() + hoursPerDay);

          // Create the crew task
          const { data: crewTask, error: taskError } = await supabase
            .from('crew_tasks')
            .insert({
              task_number: 1, // Default task number, can be adjusted
              task_type: 'charter',
              task_status: 'scheduled',
              driver_id: booking.driver_id,
              start_date: currentDate.toISOString().split('T')[0],
              end_date: currentDate.toISOString().split('T')[0],
              start_time: startTime,
              end_time: endDateTime.toTimeString().split(' ')[0],
              hours_per_day: hoursPerDay,
              total_hours: hoursPerDay,
              booking_id: booking.id,
              title: `${booking.service_name}${serviceDays > 1 ? ` (Day ${dayOffset + 1}/${serviceDays})` : ''}`,
              description: `${booking.service_type} service`,
              location: booking.pickup_location,
              customer_name: booking.customer_name,
              customer_phone: booking.customer_phone,
              priority: 1,
              notes: `From booking ${booking.wp_id}`
            })
            .select()
            .single();

          if (taskError) {
            console.error(`Error creating crew task for booking ${booking.wp_id}, day ${dayOffset + 1}:`, taskError);
            errors.push({
              booking_id: booking.id,
              wp_id: booking.wp_id,
              day: dayOffset + 1,
              error: taskError.message
            });
          } else {
            syncedTasks.push({
              booking_id: booking.id,
              wp_id: booking.wp_id,
              task_id: crewTask.id,
              day: dayOffset + 1,
              date: currentDate.toISOString().split('T')[0]
            });
          }
        }

        // Update the booking to mark it as synced (optional)
        await supabase
          .from('bookings')
          .update({ 
            assignment_status: 'scheduled',
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);

      } catch (error) {
        console.error(`Error processing booking ${booking.wp_id}:`, error);
        errors.push({
          booking_id: booking.id,
          wp_id: booking.wp_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Sync completed. ${syncedTasks.length} tasks created from ${bookings.length} bookings`,
      synced: syncedTasks.length,
      total_bookings: bookings.length,
      synced_tasks: syncedTasks,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in booking sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check sync status and get statistics
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
