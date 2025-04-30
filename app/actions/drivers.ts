'use server'

import { createServiceClient } from "@/lib/supabase/service-client"
import { revalidatePath } from "next/cache"

/**
 * Unassigns a specific vehicle from a specific driver.
 * It finds the active assignment and sets its status to 'inactive'.
 */
export async function unassignVehicleFromDriverAction(
  driverId: string,
  vehicleId: string
): Promise<{ success: boolean; message: string }> {
  if (!driverId || !vehicleId) {
    return { success: false, message: "Driver ID and Vehicle ID are required." };
  }

  try {
    const supabase = createServiceClient();

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

    // Revalidate the driver details page path
    revalidatePath(`/drivers/${driverId}`);
    // Optionally revalidate vehicles list page if needed
    // revalidatePath('/vehicles');

    return { success: true, message: "Vehicle unassigned successfully." };

  } catch (error) {
    console.error("Error in unassignVehicleFromDriverAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: errorMessage };
  }
} 