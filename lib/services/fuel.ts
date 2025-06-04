import { createClient } from '@/lib/supabase/index';
import type { FuelLog } from "@/types"
import type { Database } from '@/types/supabase'

// Define more specific types for insert and update based on the actual table schema
type FuelEntryRow = Database['public']['Tables']['fuel_entries']['Row'];
type FuelEntryInsert = Database['public']['Tables']['fuel_entries']['Insert'];
type FuelEntryUpdate = Database['public']['Tables']['fuel_entries']['Update'];

/**
 * Fetches fuel logs, optionally filtered by vehicle ID.
 * Includes basic vehicle information (id, name, plate_number) for each log.
 * Logs are ordered by date in descending order.
 *
 * @param vehicleId - Optional. The unique identifier of the vehicle to filter logs by.
 * @returns A promise that resolves to an object containing an array of FuelLog objects.
 *          Returns an empty array in `logs` if an error occurs or no logs are found.
 */
export async function getFuelLogs(vehicleId?: string) {
  const supabase = createClient();
  try {
    let query = supabase
      .from('fuel_entries')
      .select(`
        *,
        vehicles (
          id,
          name,
          plate_number
        )
      `)
      .order('date', { ascending: false })

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId)
    }

    const { data, error } = await query

    if (error) throw error

    return { logs: data as unknown as FuelLog[] }
  } catch (error) {
    console.error('Error:', error)
    return { logs: [] }
  }
}

/**
 * Fetches a single fuel log by its ID.
 * Includes detailed vehicle information.
 * The `userId` parameter is present but not currently used for filtering in the query logic,
 * relying on RLS or post-fetch validation if needed.
 *
 * @param id - The unique identifier of the fuel log.
 * @param userId - Optional. The user ID (currently not used for direct query filtering).
 * @returns A promise that resolves to an object containing the FuelLog object or null if not found or an error occurs.
 */
export async function getFuelLog(id: string, userId?: string) {
  const supabase = createClient();
  try {
    // Fetch directly using the server client
    const { data: fuelLog, error: fuelError } = await supabase
      .from('fuel_entries')
      .select(`
        *,
        vehicle:vehicles (
          id,
          name,
          plate_number,
          brand,
          model,
          year,
          status,
          image_url,
          vin,
          user_id // Keep user_id from vehicle for potential ownership checks
        )
      `)
      .eq('id', id)
      .single();

    if (fuelError) {
      console.error('Error fetching fuel log:', fuelError);
      return { log: null };
    }

    // If userId is provided, we might still want to perform an ownership check here
    // depending on application logic, even if RLS is the primary mechanism.
    // For now, RLS on the server client should handle access.
    // If specific post-fetch validation against userId is needed, it can be added here.
    // Example: if (userId && fuelLog.user_id !== userId && (!fuelLog.vehicle || fuelLog.vehicle.user_id !== userId)) { ... }

    return { log: fuelLog as unknown as FuelLog | null }; // Ensure proper typing
  } catch (error) {
    console.error('Error in getFuelLog:', error);
    return { log: null };
  }
}

/**
 * Creates a new fuel log entry.
 * Includes basic vehicle information in the returned log.
 *
 * @param log - The fuel log data to create. Should conform to FuelEntryInsert type.
 * @returns A promise that resolves to an object containing the newly created FuelLog,
 *          or an error object if creation fails.
 */
export async function createFuelLog(log: FuelEntryInsert) {
  const supabase = createClient();
  try {
    // Supabase client expects only the fields present in the table for insert.
    // `log` should conform to FuelEntryInsert.
    const { data, error } = await supabase
      .from('fuel_entries')
      .insert(log) // Pass the prepared log object directly
      .select(`
        *,
        vehicles (
          id,
          name,
          plate_number
        )
      `)
      .single();

    if (error) throw error;

    return { log: data as unknown as FuelLog }; // Cast to the more decorated FuelLog type for return
  } catch (error) {
    console.error('Error:', error);
    return { error };
  }
}

/**
 * Updates an existing fuel log entry by its ID.
 * Includes basic vehicle information in the returned log.
 *
 * @param id - The unique identifier of the fuel log to update.
 * @param log - An object containing the fields to update on the fuel log. Should conform to FuelEntryUpdate type.
 * @returns A promise that resolves to an object containing the updated FuelLog,
 *          or null if the log is not found after update, or an error object if the update fails.
 */
export async function updateFuelLog(id: string, log: FuelEntryUpdate) {
  const supabase = createClient();
  try {
    console.log('Updating fuel log:', { id, log })
    
    // Supabase client expects only the fields present in the table for update.
    // `log` should conform to FuelEntryUpdate.
    const { data, error } = await supabase
      .from('fuel_entries')
      .update(log) // Pass the prepared log object directly
      .eq('id', id)
      .select(`
        *,
        vehicles (
          id,
          name,
          plate_number
        )
      `)
      .maybeSingle()

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    // data can be null if maybeSingle() doesn't find a match after update
    // This might not be an error condition necessarily, depends on expectations.
    if (!data) {
      // console.warn('No data returned after update, possibly no matching record or RLS issue.');
      // Consider what to return here. Throwing an error might be too strong if RLS is a factor or ID was not found.
      // For now, returning null log to indicate no data was returned by the query.
      return { log: null, error: new Error('No data returned after update query.') };    }

    console.log('Successfully updated fuel log:', data)
    return { log: data as unknown as FuelLog }
  } catch (error) {
    console.error('Error in updateFuelLog:', error)
    return { error }
  }
}

/**
 * Deletes a fuel log entry by its ID.
 *
 * @param id - The unique identifier of the fuel log to delete.
 * @returns A promise that resolves to an object containing an error if one occurred, or null for success.
 */
export async function deleteFuelLog(id: string) {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from('fuel_entries')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error }
  }
} 