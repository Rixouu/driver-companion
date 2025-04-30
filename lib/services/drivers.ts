import { supabase } from "@/lib/supabase/client"
import type { Driver, DriverAvailabilityStatus } from "@/types/drivers"
import { format } from 'date-fns'
import { getDriverAvailability } from './driver-availability'

// Get all drivers
export async function getDrivers(): Promise<Driver[]> {
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

    // Try applying the deleted_at filter
    try {
      const { error: filterCheckError } = await supabase
        .from('drivers')
        .select('id')
        .is('deleted_at', null)
        .limit(1); // Just check if the filter works

      if (!filterCheckError) {
        query = query.is('deleted_at', null);
        console.log("Applying deleted_at filter");
      } else if (filterCheckError.code === '42703') {
        console.warn("'deleted_at' column not found, fetching all drivers.");
      } else {
        throw filterCheckError; // Rethrow other filter check errors
      }
    } catch (err) {
       console.error("Error checking 'deleted_at' filter:", err);
       // Proceed without filter if check fails
    }

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

// Get a single driver by ID
export async function getDriverById(id: string) {
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

// Create a new driver
export async function createDriver(driver: Partial<Driver>) {
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

// Update an existing driver
export async function updateDriver(id: string, driver: Partial<Driver>) {
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

// Delete a driver
export async function deleteDriver(id: string) {
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

// Get inspections by driver
export async function getDriverInspections(driverId: string) {
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
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })

      if (!error) {
        return data || []
      }
      
      // If there's a "column does not exist" error, we'll return an empty array
      if (error.code === '42703' && error.message.includes('driver_id does not exist')) {
        console.log("driver_id column doesn't exist in inspections table yet")
        return []
      }
      
      console.log("First getDriverInspections attempt error:", JSON.stringify(error))
      throw error
    } catch (error) {
      console.error(`Detailed error getting inspections for driver ${driverId}:`, error)
      return [] // Return empty array to avoid breaking the UI
    }
  } catch (error) {
    console.error(`Detailed error getting inspections for driver ${driverId}:`, error)
    return [] // Return empty array to avoid breaking the UI
  }
}

// Assign a vehicle to a driver
export async function assignVehicleToDriver(driverId: string, vehicleId: string) {
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
    
    // Also update any inspections for this vehicle with the driver_id
    const { error: inspectionError } = await supabase
      .from('inspections')
      .update({ 
        driver_id: driverId,
        updated_at: new Date().toISOString()
      })
      .eq('vehicle_id', vehicleId)
      .is('driver_id', null);

    if (inspectionError) throw inspectionError;
    
    return assignment;
  } catch (error) {
    console.error("Error assigning vehicle to driver:", error);
    throw error;
  }
}

// Assign multiple vehicles to a driver
export async function assignMultipleVehiclesToDriver(driverId: string, vehicleIds: string[]) {
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
      await supabase
        .from('inspections')
        .update({ 
          driver_id: driverId,
          updated_at: new Date().toISOString()
        })
        .eq('vehicle_id', vehicleId)
        .is('driver_id', null);
    }
    
    return data;
  } catch (error) {
    console.error("Error assigning multiple vehicles to driver:", error);
    throw error;
  }
}

// Unassign a vehicle from a driver
export async function unassignVehicleFromDriver(vehicleId: string) {
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
      .single();

    if (assignmentError) throw assignmentError;
    
    return assignment;
  } catch (error) {
    console.error("Error unassigning vehicle from driver:", error);
    throw error;
  }
}

// Get user by auth ID (for mapping to driver)
export async function getUserByAuthId(authId: string) {
  const { data, error } = await supabase.auth.getUser(authId)
  
  if (error) throw error
  return data.user
} 