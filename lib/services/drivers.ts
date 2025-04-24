import { supabase } from "@/lib/supabase/client"
import type { Driver, DbDriver, DriverFormData } from "@/types"

// Get all drivers
export async function getDrivers() {
  try {
    // First attempt to get drivers with deleted_at filter
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
              model
            ),
            status
          )
        `)
        .is('deleted_at', null)
        .order('last_name', { ascending: true })

      if (!error) {
        // Success with deleted_at filter
        if (!data) return []
        
        // Add full_name property and format assigned_vehicles
        const driversWithFullName = (data as any[]).map(driver => ({
          ...driver,
          full_name: `${driver.first_name} ${driver.last_name}`,
          assigned_vehicles: (driver.assigned_vehicles || [])
            .filter((assignment: { status: string; vehicle: any }) => 
              assignment.status === 'active' && assignment.vehicle)
            .map((assignment: { vehicle: any }) => assignment.vehicle)
        }))
        
        return driversWithFullName as unknown as Driver[]
      }
      
      // If error is related to deleted_at column, fall back to simpler query
      console.log("First query attempt error:", JSON.stringify(error))
    } catch (firstAttemptError) {
      console.log("First attempt exception:", firstAttemptError)
    }
    
    // Fallback query without deleted_at filter if first attempt failed
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
            model
          ),
          status
        )
      `)
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Error in fallback drivers query:', JSON.stringify(error))
      throw error
    }
    
    if (!data) return []
    
    // Add full_name property and format assigned_vehicles
    const driversWithFullName = (data as any[]).map(driver => ({
      ...driver,
      full_name: `${driver.first_name} ${driver.last_name}`,
      assigned_vehicles: (driver.assigned_vehicles || [])
        .filter((assignment: { status: string; vehicle: any }) => 
          assignment.status === 'active' && assignment.vehicle)
        .map((assignment: { vehicle: any }) => assignment.vehicle)
    }))
    
    return driversWithFullName as unknown as Driver[]
  } catch (error) {
    console.error('Detailed error fetching drivers:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } else {
      console.error('Unknown error type:', typeof error)
    }
    throw error
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
              model
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
            model
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
export async function createDriver(driver: DriverFormData) {
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
export async function updateDriver(id: string, driver: Partial<DriverFormData>) {
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