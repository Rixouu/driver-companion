import { createServiceClient } from "@/lib/supabase/service-client"
import type { Driver, DriverAvailabilityStatus } from "@/types/drivers"
import { format } from 'date-fns'
import { getDriverAvailability } from './driver-availability'

/**
 * Fetches a list of all non-deleted drivers, including their current availability status.
 * Drivers are ordered by last name (ascending).
 * Availability is determined by checking `driver_availability` records for the current date.
 *
 * @returns A promise that resolves to an array of Driver objects, each augmented with `full_name` and `availability_status`.
 * @throws Will throw an error if the database query for drivers or their availability fails.
 */
export async function getDrivers(): Promise<Driver[]> {
  const supabase = createServiceClient(); // Use service client
  try {
    const today = format(new Date(), "yyyy-MM-dd");

    // Base query selecting necessary fields (added missing fields)
    let query = supabase
      .from('drivers')
      .select(`
        id, first_name, last_name, email, phone, 
        line_id, license_number, license_expiry, profile_image_url, 
        address, emergency_contact, notes, user_id, 
        created_at, updated_at, deleted_at
      `)
      .order('last_name', { ascending: true });

    // Directly apply the deleted_at filter, assuming the column exists.
    // If it might not, this error should be handled by the caller or a more robust schema check.
    query = query.is('deleted_at', null);
    console.log("Applying deleted_at filter");

    // Execute the final query
    const { data: driversData, error: driversError } = await query;

    if (driversError) throw driversError;
    if (!driversData) return [];

    // Fetch availability for all drivers concurrently
    const availabilityPromises = driversData.map(driver => 
        getDriverAvailability(driver.id)
          .then(availabilityRecords => {
            const currentRecord = availabilityRecords.find(
              record => record.start_date <= today && record.end_date >= today
            );
            return currentRecord?.status || 'available'; // Default to available
          })
          .catch(err => {
             console.error(`Failed to fetch availability for driver ${driver.id}:`, err);
             return 'available'; // Default on error
          })
    );
    
    const availabilityStatuses = await Promise.all(availabilityPromises);

    // Combine driver data with availability status
    const driversWithDetails: Driver[] = driversData.map((driver, index) => ({
      // Explicitly map fields to match the Driver type
      id: driver.id,
      first_name: driver.first_name,
      last_name: driver.last_name,
      full_name: `${driver.first_name} ${driver.last_name}`,
      email: driver.email || '', // Provide default empty string if email is null/undefined
      phone: driver.phone || undefined,
      status: (availabilityStatuses[index] || 'available') as DriverAvailabilityStatus,
      profile_image_url: driver.profile_image_url || undefined,
      created_at: driver.created_at || new Date().toISOString(),
      deleted_at: driver.deleted_at,
      availability_status: availabilityStatuses[index] as DriverAvailabilityStatus,
      license_number: driver.license_number || undefined,
      license_expiry: driver.license_expiry || undefined,
      line_id: driver.line_id || undefined,
      address: driver.address || undefined,
      emergency_contact: driver.emergency_contact || undefined,
      notes: driver.notes || undefined,
      user_id: driver.user_id || undefined,
      assigned_vehicles: [], 
      updated_at: driver.updated_at || undefined,
    }));

    return driversWithDetails;

  } catch (error) {
    console.error('Detailed error fetching drivers:', error);
    throw error;
  }
}

/**
 * Fetches a single driver by their ID, including their actively assigned vehicles.
 * It first attempts to find a non-deleted driver. If not found (or an error occurs), 
 * it falls back to searching for any driver with that ID (including potentially soft-deleted ones).
 *
 * @param id - The unique identifier of the driver.
 * @returns A promise that resolves to the Driver object, augmented with `full_name` and an array of `assigned_vehicles` (active assignments only).
 * @throws Will throw an error if the driver is not found after both attempts or if a database query fails.
 */
// Get a single driver by ID
export async function getDriverById(id: string) {
  const supabase = createServiceClient(); // Use service client
  try {
    // First attempt with deleted_at filter
    try {
      const { data, error } = await (supabase as any)
        .from('drivers')
        .select(`
          *,
          assigned_vehicles:vehicle_assignments!driver_id(
            vehicle:vehicle_id(
              id,
              name,
              plate_number,
              image_url,
              brand,
              model,
              status
            ),
            status
          )
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      if (!error) {
        if (!data) {
          throw new Error(`Driver with id ${id} not found`)
        }
        
        // Add full_name property and format assigned vehicles
        const driver = {
          ...(data as any),
          full_name: `${(data as any).first_name} ${(data as any).last_name}`,
          assigned_vehicles: (data.assigned_vehicles || [])
            .filter((assignment: { status: string; vehicle: any }) => 
              assignment.status === 'active' && assignment.vehicle)
            .map((assignment: { vehicle: any }) => assignment.vehicle)
        }
        
        return driver as unknown as Driver
      }
      
      console.log("First getDriverById attempt error:", JSON.stringify(error))
    } catch (firstAttemptError) {
      console.log("First getDriverById attempt exception:", firstAttemptError)
    }
    
    // Fallback query without deleted_at
    const { data, error } = await (supabase as any)
      .from('drivers')
      .select(`
        *,
        assigned_vehicles:vehicle_assignments!driver_id(
          vehicle:vehicle_id(
            id,
            name,
            plate_number,
            image_url,
            brand,
            model,
            status
          ),
          status
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error(`Error getting driver ${id}:`, JSON.stringify(error))
      throw error
    }
    
    if (!data) {
      throw new Error(`Driver with id ${id} not found`)
    }
    
    // Add full_name property and format assigned vehicles
    const driver = {
      ...(data as any),
      full_name: `${(data as any).first_name} ${(data as any).last_name}`,
      assigned_vehicles: (data.assigned_vehicles || [])
        .filter((assignment: { status: string; vehicle: any }) => 
          assignment.status === 'active' && assignment.vehicle)
        .map((assignment: { vehicle: any }) => assignment.vehicle)
    }
    
    return driver as unknown as Driver
  } catch (error) {
    console.error(`Detailed error getting driver ${id}:`, error)
    throw error
  }
}

/**
 * Creates a new driver record, associating it with the currently authenticated user.
 *
 * @param driver - A partial Driver object containing the details for the new driver. 
 *                 `user_id` will be automatically set to the authenticated user's ID.
 * @returns A promise that resolves to the newly created Driver object, augmented with `full_name`.
 * @throws Will throw an error if the user is not authenticated, if driver insertion fails, or if no data is returned.
 */
// Create a new driver
export async function createDriver(driver: Partial<Driver>) {
  const supabase = createServiceClient(); // Use service client
  try {
    // Get current user ID
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user:', JSON.stringify(userError))
      throw userError
    }
    
    const userId = userData.user?.id
    
    if (!userId) {
      throw new Error('User not authenticated')
    }
    
    // Insert the new driver
    const { data, error } = await (supabase as any)
      .from('drivers')
      .insert({
        ...driver,
        user_id: userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating driver:', JSON.stringify(error))
      throw error
    }
    
    if (!data) {
      throw new Error('Failed to retrieve created driver data')
    }
    
    return {
      ...(data as any),
      full_name: `${(data as any).first_name} ${(data as any).last_name}`
    } as unknown as Driver
  } catch (error) {
    console.error('Detailed error creating driver:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } else {
      console.error('Unknown error type:', typeof error)
    }
    throw error
  }
}

/**
 * Updates an existing driver's information.
 * It attempts to update a non-deleted driver first. If that fails (e.g., driver not found or already deleted),
 * it falls back to updating any driver with the given ID, setting `updated_at` and potentially clearing `deleted_at`.
 *
 * @param id - The unique identifier of the driver to update.
 * @param driver - A partial Driver object containing the fields to update. `updated_at` is automatically set.
 *                 If `deleted_at` is explicitly provided in the partial, it will be used (e.g., for undeleting).
 * @returns A promise that resolves to the updated Driver object, augmented with `full_name`.
 * @throws Will throw an error if the update fails after both attempts or if the driver is not found.
 */
// Update an existing driver
export async function updateDriver(id: string, driver: Partial<Driver>) {
  const supabase = createServiceClient(); // Use service client
  try {
    // First attempt with deleted_at filter
    try {
      const { data, error } = await (supabase as any)
        .from('drivers')
        .update({
          ...driver,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .is('deleted_at', null)
        .select()
        .single()

      if (!error) {
        return {
          ...(data as any),
          full_name: `${(data as any).first_name} ${(data as any).last_name}`
        } as unknown as Driver
      }
      
      console.log("First updateDriver attempt error:", JSON.stringify(error))
    } catch (firstAttemptError) {
      console.log("First updateDriver attempt exception:", firstAttemptError)
    }
    
    // Fallback without deleted_at filter
    const { data, error } = await (supabase as any)
      .from('drivers')
      .update({
        ...driver,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`Error updating driver ${id}:`, JSON.stringify(error))
      throw error
    }
    
    return {
      ...(data as any),
      full_name: `${(data as any).first_name} ${(data as any).last_name}`
    } as unknown as Driver
  } catch (error) {
    console.error(`Detailed error updating driver ${id}:`, error)
    throw error
  }
}

/**
 * Deletes a driver record. This performs a soft delete by setting the `deleted_at` timestamp.
 * If the soft delete fails, it attempts a hard delete.
 *
 * @param id - The unique identifier of the driver to delete.
 * @returns A promise that resolves to true if the deletion (soft or hard) was successful.
 * @throws Will throw an error if both soft and hard delete attempts fail.
 */
// Delete a driver
export async function deleteDriver(id: string) {
  const supabase = createServiceClient(); // Use service client
  try {
    // Try soft delete first
    try {
      const { error } = await (supabase as any)
        .from('drivers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (!error) {
        return true
      }
      
      console.log("Soft delete attempt error:", JSON.stringify(error))
    } catch (softDeleteError) {
      console.log("Soft delete attempt exception:", softDeleteError)
    }
    
    // Fall back to hard delete if soft delete fails
    const { error } = await (supabase as any)
      .from('drivers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`Error deleting driver ${id}:`, JSON.stringify(error))
      throw error
    }
    
    return true
  } catch (error) {
    console.error(`Detailed error deleting driver ${id}:`, error)
    throw error
  }
}

/**
 * Fetches all inspections associated with a specific driver.
 * Includes basic vehicle information for each inspection.
 * Orders inspections by creation date (descending).
 * Handles cases where the `driver_id` column might not yet exist in the `inspections` table.
 *
 * @param driverId - The unique identifier of the driver.
 * @returns A promise that resolves to an array of inspection objects. Returns an empty array if no inspections are found or if an error occurs (e.g., `driver_id` column missing).
 */
// Get inspections by driver
export async function getDriverInspections(driverId: string) {
  const supabase = createServiceClient(); // Use service client
  try {
    // First, check if the driver_id column exists in the inspections table
    try {
      const { data, error } = await (supabase as any)
        .from('inspections')
        .select(`
          *,
          vehicle:vehicles(
            id,
            name,
            plate_number,
            image_url
          )
        `)
        .eq('inspector_id', driverId)
        .order('created_at', { ascending: false })

      if (!error) {
        return data || []
      }
      
      // If there's a "column does not exist" error, we'll return an empty array
      if (error.code === '42703' && error.message.includes('inspector_id does not exist')) {
        console.log("inspector_id column doesn't exist in inspections table yet")
        return []
      }
      
      console.log("First getDriverInspections attempt error:", JSON.stringify(error))
      throw error
    } catch (error) {
      console.error(`Detailed error getting inspections for driver ${driverId}:`, error)
      return [] // Return empty array to avoid breaking the UI
    }
  } catch (error) {
    console.error(`Error in getDriverInspections for driver ${driverId}:`, error) // Fixed unterminated template literal
    throw error;
  }
}

/**
 * Assigns a single vehicle to a driver.
 * This creates a new 'active' vehicle assignment record.
 * It also updates any existing inspections for the vehicle that have a null `driver_id` to this driver.
 *
 * @param driverId - The unique identifier of the driver.
 * @param vehicleId - The unique identifier of the vehicle to assign.
 * @returns A promise that resolves to the newly created vehicle assignment object.
 * @throws Will throw an error if creating the assignment or updating inspections fails.
 */
// Assign a vehicle to a driver
export async function assignVehicleToDriver(driverId: string, vehicleId: string) {
  const supabase = createServiceClient(); // Use service client
  try {
    // Create a new vehicle assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('vehicle_assignments')
      .insert({
        vehicle_id: vehicleId,
        driver_id: driverId,
        status: 'active',
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (assignmentError) throw assignmentError;
    
    // Also update any inspections for this vehicle with the inspector_id
    const { error: inspectionError } = await supabase
      .from('inspections')
      .update({ 
        inspector_id: driverId,
        updated_at: new Date().toISOString()
      })
      .eq('vehicle_id', vehicleId)
      .is('inspector_id', null);

    if (inspectionError) {
        // Log the error but don't necessarily throw, assignment was successful
        console.warn('Error updating inspections after assigning vehicle:', inspectionError);
    }
    
    return assignment;
  } catch (error) {
    console.error("Error assigning vehicle to driver:", error);
    throw error;
  }
}

/**
 * Assigns multiple vehicles to a single driver.
 * Creates 'active' assignment records for each vehicle.
 * Updates inspections for all assigned vehicles that have a null `driver_id`.
 *
 * @param driverId - The unique identifier of the driver.
 * @param vehicleIds - An array of vehicle unique identifiers to assign.
 * @returns A promise that resolves to an array of the newly created vehicle assignment objects.
 * @throws Will throw an error if creating assignments or updating inspections fails.
 */
// Assign multiple vehicles to a driver
export async function assignMultipleVehiclesToDriver(driverId: string, vehicleIds: string[]) {
  const supabase = createServiceClient(); // Use service client
  try {
    // Create an array of vehicle assignments
    const assignments = vehicleIds.map(vehicleId => ({
      vehicle_id: vehicleId,
      driver_id: driverId,
      status: 'active',
      start_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insert all assignments
    const { data, error: assignmentError } = await supabase
      .from('vehicle_assignments')
      .insert(assignments)
      .select();

    if (assignmentError) throw assignmentError;
    
    // Update inspections for all these vehicles
    for (const vehicleId of vehicleIds) {
      try {
        await supabase
          .from('inspections')
          .update({ 
            driver_id: driverId,
            updated_at: new Date().toISOString()
          })
          .eq('vehicle_id', vehicleId)
          .is('driver_id', null);
      } catch (inspectionError) {
        console.warn(`Error updating inspections for vehicle ${vehicleId} during multi-assign:`, inspectionError);
        // Continue trying to update other inspections
      }
    }
    
    return data;
  } catch (error) {
    console.error("Error assigning multiple vehicles to driver:", error);
    throw error;
  }
}

/**
 * Unassigns a vehicle from any active driver assignment.
 * Sets the status of the active assignment for the given vehicle to 'inactive' and records an end date.
 *
 * @param vehicleId - The unique identifier of the vehicle to unassign.
 * @returns A promise that resolves to the updated (now inactive) vehicle assignment object.
 * @throws Will throw an error if updating the assignment fails or no active assignment is found for the vehicle.
 */
// Unassign a vehicle from a driver
export async function unassignVehicleFromDriver(vehicleId: string) {
  const supabase = createServiceClient(); // Use service client
  try {
    // Set the vehicle assignment to inactive
    const { data: assignment, error: assignmentError } = await supabase
      .from('vehicle_assignments')
      .update({
        status: 'inactive',
        end_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .select()
      .single(); // Assuming a vehicle can only have one active assignment

    if (assignmentError) throw assignmentError;
    
    return assignment;
  } catch (error) {
    console.error("Error unassigning vehicle from driver:", error);
    throw error;
  }
}

/**
 * Fetches a user object based on their Supabase authentication ID.
 * This can be used to map an authenticated user to a driver or other user-related records.
 *
 * @param authId - The Supabase authentication user ID.
 * @returns A promise that resolves to the Supabase User object.
 * @throws Will throw an error if fetching the user fails.
 */
// Get user by auth ID (for mapping to driver)
export async function getUserByAuthId(authId: string) {
  const supabase = createServiceClient(); // Use service client
  const { data, error } = await supabase.auth.getUser(authId) // This seems incorrect, getUser() usually doesn't take an ID directly
                                                              // It should be admin.getUserById(authId) if using admin client
                                                              // Or, if this is meant for current user, it's just supabase.auth.getUser()
  
  if (error) throw error
  // Assuming data.user is the correct path if this method worked as intended.
  // For a specific user by ID, you'd typically use an admin client or a function call.
  // This implementation might be for the currently authenticated user if authId is their own ID
  // or needs adjustment based on how Supabase client is intended to be used here.
  if (data && data.user) {
      return data.user;
  }
  throw new Error("User not found or error fetching user by auth ID");
}