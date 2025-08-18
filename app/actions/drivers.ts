'use server'

import { createServiceClient } from "@/lib/supabase/service-client"
import { revalidatePath } from "next/cache"
import type { Driver } from "@/types/drivers"
import { getDrivers as getDriversService } from "@/lib/services/drivers"

/**
 * Unassigns a specific vehicle from a specific driver.
 * It finds the active assignment and sets its status to 'inactive'.
 * Also checks for active bookings before unassigning.
 */
export async function unassignVehicleFromDriverAction(
  driverId: string,
  vehicleId: string,
  options: {
    keepBookingAssignments?: boolean;
  } = {}
): Promise<{ success: boolean; message: string; hasActiveBookings?: boolean }> {
  if (!driverId || !vehicleId) {
    return { success: false, message: "Driver ID and Vehicle ID are required." };
  }

  const { keepBookingAssignments = false } = options;

  try {
    const supabase = createServiceClient();

    // First, check if there are any active bookings using this driver and vehicle
    const { data: activeBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, date, time, status, wp_id')
      .eq('driver_id', driverId)
      .eq('vehicle_id', vehicleId)
      .in('status', ['confirmed', 'pending'])
      .gte('date', new Date().toISOString().split('T')[0]); // Only check future/current bookings

    if (bookingsError) {
      console.error("Error checking active bookings:", bookingsError);
      // Continue with unassignment but log the error
    }

    // If there are active bookings and we're not keeping booking assignments
    if (activeBookings && activeBookings.length > 0 && !keepBookingAssignments) {
      return { 
        success: false, 
        message: `This vehicle has ${activeBookings.length} active bookings with this driver. Please reassign those bookings first or use the force option.`,
        hasActiveBookings: true
      };
    }

    // Find the active assignment for this driver and vehicle
    const { data: assignment, error: findError } = await supabase
      .from('vehicle_assignments')
      .select('id')
      .eq('driver_id', driverId)
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active') // Ensure we only target the active assignment
      .maybeSingle();

    if (findError) {
      console.error("Error finding vehicle assignment:", findError);
      throw findError;
    }

    if (!assignment) {
      // No active assignment found - maybe already unassigned?
      // Consider this a success in terms of the end state, but log a warning.
      console.warn(`No active assignment found for driver ${driverId} and vehicle ${vehicleId}.`);
      return { success: true, message: "Vehicle already unassigned or assignment not found." };
    }

    // Update the assignment status to inactive
    const { error: updateError } = await supabase
      .from('vehicle_assignments')
      .update({
        status: 'inactive',
        end_date: new Date().toISOString(), // Set end date
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignment.id);

    if (updateError) {
      console.error("Error updating vehicle assignment:", updateError);
      throw updateError;
    }

    // If user opts to continue despite bookings, create driver_availability records for each booking
    if (keepBookingAssignments && activeBookings && activeBookings.length > 0) {
      console.log(`Creating ${activeBookings.length} driver availability records for bookings`);
      
      // For each booking, create a special driver_availability record
      for (const booking of activeBookings) {
        try {
          // Get full booking details to get start/end times
          const { data: fullBooking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', booking.id)
            .single();
            
          if (bookingError) {
            console.error(`Error fetching full booking details for booking ${booking.id}:`, bookingError);
            continue;
          }
          
          // Format start/end dates for availability
          const bookingDate = fullBooking.date;
          const bookingTime = fullBooking.time || '00:00';
          
          // Create a start time from date + time
          const startDateTime = new Date(`${bookingDate}T${bookingTime}`);
          
          // End time is typically 2 hours after start, or use duration if available
          let endDateTime = new Date(startDateTime);
          if (fullBooking.duration) {
            // If duration is in minutes, add it
            const durationMinutes = parseInt(fullBooking.duration, 10) || 120;
            endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);
          } else {
            // Default to 2 hour duration
            endDateTime.setHours(endDateTime.getHours() + 2);
          }
          
          // Insert driver availability record for this booking
          const { error: availabilityError } = await supabase
            .from('driver_availability')
            .insert({
              driver_id: driverId,
              status: 'unavailable',
              start_date: startDateTime.toISOString(),
              end_date: endDateTime.toISOString(),
              notes: `Assigned to booking ${fullBooking.wp_id || booking.id} (maintained after vehicle unassignment)`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            
          if (availabilityError) {
            console.error(`Error creating availability record for booking ${booking.id}:`, availabilityError);
          }
        } catch (bookingError) {
          console.error(`Error processing booking ${booking.id}:`, bookingError);
        }
      }
    }

    // Revalidate the driver details page path
    revalidatePath(`/drivers/${driverId}`);

    return { 
      success: true, 
      message: activeBookings && activeBookings.length > 0 
        ? "Vehicle unassigned successfully. Booking availability periods have been created."
        : "Vehicle unassigned successfully." 
    };

  } catch (error) {
    console.error("Error in unassignVehicleFromDriverAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: errorMessage };
  }
} 

/**
 * Server action: fetch drivers list on the server to avoid using the service client in the browser.
 */
export async function getDriversAction(): Promise<Driver[]> {
  try {
    // Reuse existing service logic which uses the Supabase service client
    const drivers = await getDriversService()
    return drivers
  } catch (error) {
    console.error('Error in getDriversAction:', error)
    return []
  }
}