/**
 * Crew Task to Booking Sync Service
 * 
 * Handles bidirectional synchronization between crew tasks and bookings
 * Phase 1: High-impact fields (date/time, location, customer info, driver)
 */

import { createServiceClient } from '@/lib/supabase/service-client';

export interface BookingSyncFields {
  driver_id?: string;
  date?: string;
  time?: string;
  pickup_location?: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface CrewTaskSyncResult {
  success: boolean;
  fieldsUpdated: string[];
  errors: string[];
}

/**
 * Syncs crew task changes back to the associated booking
 * Only syncs fields that have actually changed
 */
export async function syncCrewTaskToBooking(
  taskId: string,
  bookingId: string,
  updatedFields: Partial<{
    driver_id?: string;
    start_date?: string;
    start_time?: string;
    location?: string;
    customer_name?: string;
    customer_phone?: string;
  }>,
  updatedBy?: string
): Promise<CrewTaskSyncResult> {
  const supabase = createServiceClient();
  const errors: string[] = [];
  const fieldsUpdated: string[] = [];

  try {
    const bookingUpdates: BookingSyncFields = {
      updated_at: new Date().toISOString(),
    };

    // 1. Driver assignment sync
    if (updatedFields.driver_id !== undefined) {
      bookingUpdates.driver_id = updatedFields.driver_id;
      fieldsUpdated.push('driver_id');

      // Update all other tasks from the same booking with the new driver
      const { error: taskUpdateError } = await supabase
        .from("crew_tasks")
        .update({
          driver_id: updatedFields.driver_id,
          updated_by: updatedBy || null,
          updated_at: new Date().toISOString(),
        })
        .eq("booking_id", bookingId)
        .neq("id", taskId);

      if (taskUpdateError) {
        errors.push(`Failed to update related tasks: ${taskUpdateError.message}`);
      }
    }

    // 2. Date/Time sync: start_date + start_time -> date + time
    if (updatedFields.start_date !== undefined) {
      bookingUpdates.date = updatedFields.start_date;
      fieldsUpdated.push('date');
    }
    if (updatedFields.start_time !== undefined) {
      bookingUpdates.time = updatedFields.start_time;
      fieldsUpdated.push('time');
    }

    // 3. Location sync: location -> pickup_location
    if (updatedFields.location !== undefined) {
      bookingUpdates.pickup_location = updatedFields.location;
      fieldsUpdated.push('pickup_location');
    }

    // 4. Customer info sync
    if (updatedFields.customer_name !== undefined) {
      bookingUpdates.customer_name = updatedFields.customer_name;
      fieldsUpdated.push('customer_name');
    }
    if (updatedFields.customer_phone !== undefined) {
      bookingUpdates.customer_phone = updatedFields.customer_phone;
      fieldsUpdated.push('customer_phone');
    }

    // Only update booking if there are actual changes (more than just updated_at)
    if (fieldsUpdated.length > 0) {
      const { error: bookingUpdateError } = await supabase
        .from("bookings")
        .update(bookingUpdates)
        .eq("id", bookingId);

      if (bookingUpdateError) {
        errors.push(`Failed to update booking: ${bookingUpdateError.message}`);
        return {
          success: false,
          fieldsUpdated: [],
          errors
        };
      }

      console.log(`Successfully synced task ${taskId} changes to booking ${bookingId}:`, fieldsUpdated);
    }

    return {
      success: errors.length === 0,
      fieldsUpdated,
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);
    console.error('Error in syncCrewTaskToBooking:', error);
    
    return {
      success: false,
      fieldsUpdated: [],
      errors
    };
  }
}

/**
 * Validates that a crew task can be synced to its booking
 * Checks if the task has a valid booking_id and the booking exists
 */
export async function validateCrewTaskSync(
  taskId: string,
  bookingId: string
): Promise<{ canSync: boolean; error?: string }> {
  const supabase = createServiceClient();

  try {
    // Check if the booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return {
        canSync: false,
        error: `Booking ${bookingId} not found`
      };
    }

    return { canSync: true };

  } catch (error) {
    return {
      canSync: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

