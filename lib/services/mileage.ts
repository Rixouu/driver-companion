import { createClient } from '@/lib/supabase/index'
// import { createServiceClient } from '@/lib/supabase/service-client'
import type { MileageLog } from "@/types"
import type { Database } from '@/types/supabase'

type MileageEntryRow = Database['public']['Tables']['mileage_entries']['Row']
type MileageEntryInsert = Database['public']['Tables']['mileage_entries']['Insert']
type MileageEntryUpdate = Database['public']['Tables']['mileage_entries']['Update']

/**
 * Fetches mileage logs, optionally filtered by vehicle ID.
 * Includes basic vehicle information (id, name, plate_number) for each log.
 * Logs are ordered by date in descending order.
 *
 * @param vehicleId - Optional. The unique identifier of the vehicle to filter logs by.
 * @returns A promise that resolves to an object containing an array of MileageLog objects.
 *          Returns an empty array in `logs` if an error occurs or no logs are found.
 */
export async function getMileageLogs(vehicleId?: string) {
  const supabase = createClient()
  try {
    let query = supabase
      .from('mileage_entries')
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

    return { logs: data as unknown as MileageLog[] }
  } catch (error) {
    console.error('Error fetching mileage logs:', error)
    return { logs: [] }
  }
}

/**
 * Fetches a single mileage log by its ID.
 * Includes detailed vehicle information.
 * The `userId` parameter is present but not currently used in the query logic.
 *
 * @param id - The unique identifier of the mileage log.
 * @param userId - Optional. The user ID (currently not used for filtering).
 * @returns A promise that resolves to an object containing the MileageLog object or null if not found or an error occurs.
 */
export async function getMileageLog(id: string, userId?: string) {
  const supabase = createClient()
  try {
    const { data: mileageLogData, error: mileageError } = await supabase
      .from('mileage_entries')
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
          user_id
        )
      `)
      .eq('id', id)
      .single()

    if (mileageError) {
      console.error('Error fetching mileage log:', mileageError)
      return { log: null }
    }

    return { log: mileageLogData as unknown as MileageLog | null }
  } catch (error) {
    console.error('Error in getMileageLog:', error)
    return { log: null }
  }
}

/**
 * Creates a new mileage log entry.
 * Includes basic vehicle information in the returned log.
 *
 * @param log - The mileage log data to create. Should conform to MileageEntryInsert type.
 * @returns A promise that resolves to an object containing the newly created MileageLog and basic vehicle info,
 *          or an error object if creation fails.
 */
export async function createMileageLog(log: MileageEntryInsert) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('mileage_entries')
      .insert(log)
      .select(`
        *,
        vehicles (
          id,
          name,
          plate_number
        )
      `)
      .single()

    if (error) throw error

    return { log: data as unknown as MileageLog }
  } catch (error) {
    console.error('Error creating mileage log:', error)
    return { error }
  }
}

/**
 * Updates an existing mileage log entry by its ID.
 * Includes basic vehicle information in the returned log.
 *
 * @param id - The unique identifier of the mileage log to update.
 * @param log - An object containing the fields to update on the mileage log. Should conform to MileageEntryUpdate type.
 * @returns A promise that resolves to an object containing the updated MileageLog and basic vehicle info,
 *          or null if the log is not found, or an error object if the update fails.
 */
export async function updateMileageLog(id: string, log: MileageEntryUpdate) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('mileage_entries')
      .update(log)
      .eq('id', id)
      .select(`
        *,
        vehicles (
          id,
          name,
          plate_number
        )
      `)
      .single()

    if (error) throw error
    if (!data) {
      console.warn(`No mileage log found with id ${id} to update.`)
      return { log: null, error: new Error(`Mileage log with id ${id} not found for update.`) }
    }

    return { log: data as unknown as MileageLog }
  } catch (error) {
    console.error('Error updating mileage log:', error)
    return { error }
  }
}

/**
 * Deletes a mileage log entry by its ID.
 *
 * @param id - The unique identifier of the mileage log to delete.
 * @returns A promise that resolves to an object containing an error if one occurred, or null for success.
 */
export async function deleteMileageLog(id: string) {
  const supabase = createClient()
  try {
    const { error } = await supabase
      .from('mileage_entries')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error deleting mileage log:', error)
    return { error }
  }
} 