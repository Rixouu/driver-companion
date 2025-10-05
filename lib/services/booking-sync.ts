import { createServiceClient } from "@/lib/supabase/service-client";

export interface BookingSyncResult {
  success: boolean;
  tasksCreated: number;
  errors: string[];
}

/**
 * Automatically sync a booking to crew tasks
 * This should be called when a booking is created or updated with a driver assignment
 */
export async function syncBookingToShifts(bookingId: string): Promise<BookingSyncResult> {
  const supabase = createServiceClient();
  const errors: string[] = [];
  let tasksCreated = 0;

  try {
    // Get the booking details
    const { data: booking, error: bookingError } = await supabase
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
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      errors.push(`Booking not found: ${bookingError?.message || 'Unknown error'}`);
      return { success: false, tasksCreated: 0, errors };
    }

    // Check if booking has a driver assigned
    if (!booking.driver_id) {
      errors.push('Booking has no driver assigned');
      return { success: false, tasksCreated: 0, errors };
    }

    // Check if booking is confirmed
    if (booking.status !== 'confirmed') {
      errors.push('Booking is not confirmed');
      return { success: false, tasksCreated: 0, errors };
    }

    // Check if this booking already has crew tasks
    const { data: existingTasks } = await supabase
      .from('crew_tasks')
      .select('id')
      .eq('booking_id', booking.id);

    if (existingTasks && existingTasks.length > 0) {
      // Update existing tasks instead of creating new ones
      return await updateExistingTasks(booking, existingTasks);
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
          task_number: 1,
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
        errors.push(`Day ${dayOffset + 1}: ${taskError.message}`);
      } else {
        tasksCreated++;
      }
    }

    // Update the booking to mark it as synced
    await supabase
      .from('bookings')
      .update({ 
        assignment_status: 'scheduled',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    return {
      success: errors.length === 0,
      tasksCreated,
      errors
    };

  } catch (error) {
    console.error('Error syncing booking to shifts:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return { success: false, tasksCreated, errors };
  }
}

/**
 * Update existing crew tasks when booking details change
 */
async function updateExistingTasks(booking: any, existingTasks: any[]): Promise<BookingSyncResult> {
  const supabase = createServiceClient();
  const errors: string[] = [];
  let tasksUpdated = 0;

  try {
    // Update each existing task with new booking details
    for (const task of existingTasks) {
      const { error: updateError } = await supabase
        .from('crew_tasks')
        .update({
          title: booking.service_name,
          description: `${booking.service_type} service`,
          location: booking.pickup_location,
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (updateError) {
        errors.push(`Task ${task.id}: ${updateError.message}`);
      } else {
        tasksUpdated++;
      }
    }

    return {
      success: errors.length === 0,
      tasksCreated: tasksUpdated,
      errors
    };

  } catch (error) {
    console.error('Error updating existing tasks:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return { success: false, tasksCreated: tasksUpdated, errors };
  }
}

/**
 * Remove crew tasks when booking is cancelled or driver is unassigned
 */
export async function removeBookingFromShifts(bookingId: string): Promise<BookingSyncResult> {
  const supabase = createServiceClient();
  const errors: string[] = [];

  try {
    // Delete all crew tasks associated with this booking
    const { error: deleteError } = await supabase
      .from('crew_tasks')
      .delete()
      .eq('booking_id', bookingId);

    if (deleteError) {
      errors.push(deleteError.message);
      return { success: false, tasksCreated: 0, errors };
    }

    // Update booking status
    await supabase
      .from('bookings')
      .update({ 
        assignment_status: 'unassigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    return {
      success: true,
      tasksCreated: 0,
      errors
    };

  } catch (error) {
    console.error('Error removing booking from shifts:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return { success: false, tasksCreated: 0, errors };
  }
}
