import { getSupabaseClient } from "@/lib/db/client";
import type { DriverAvailability, DriverAvailabilityStatus } from "@/types/drivers";

const supabase = getSupabaseClient();

/**
 * Get all availability records for a specific driver
 * @param driverId The ID of the driver
 */
export async function getDriverAvailability(driverId: string): Promise<DriverAvailability[]> {
  const { data, error } = await supabase
    .from('driver_availability')
    .select('*')
    .eq('driver_id', driverId)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data as DriverAvailability[];
}

/**
 * Get all driver availability records within a date range
 * @param startDate Start date of the range
 * @param endDate End date of the range
 */
export async function getDriverAvailabilityInRange(
  startDate: string,
  endDate: string
): Promise<DriverAvailability[]> {
  const { data, error } = await supabase
    .from('driver_availability')
    .select('*, driver:drivers(id, name, email, phone)')
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

  if (error) throw error;
  return data as unknown as DriverAvailability[];
}

/**
 * Create a new availability record for a driver
 * @param availability The availability record to create
 */
export async function createDriverAvailability(
  availability: Omit<DriverAvailability, 'id' | 'created_at' | 'updated_at'>
): Promise<DriverAvailability> {
  const { data, error } = await supabase
    .from('driver_availability')
    .insert({
      ...availability,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data as DriverAvailability;
}

/**
 * Update an existing driver availability record
 * @param id The ID of the availability record to update
 * @param updates The updates to apply
 */
export async function updateDriverAvailability(
  id: string,
  updates: Partial<Omit<DriverAvailability, 'id' | 'driver_id' | 'created_at'>>
): Promise<DriverAvailability> {
  const { data, error } = await supabase
    .from('driver_availability')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DriverAvailability;
}

/**
 * Delete a driver availability record
 * @param id The ID of the availability record to delete
 */
export async function deleteDriverAvailability(id: string): Promise<void> {
  const { error } = await supabase
    .from('driver_availability')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Check if a driver is available on a specific date
 * @param driverId The ID of the driver
 * @param date The date to check
 * @param desiredStatus The status to check for (defaults to 'available')
 */
export async function isDriverAvailable(
  driverId: string,
  date: string,
  desiredStatus: DriverAvailabilityStatus = 'available'
): Promise<boolean> {
  const { data, error } = await supabase
    .from('driver_availability')
    .select('status')
    .eq('driver_id', driverId)
    .lte('start_date', date)
    .gte('end_date', date)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  
  // If no records found, driver is considered available
  if (!data || data.length === 0) {
    return desiredStatus === 'available';
  }
  
  // Otherwise, check if the status matches the desired status
  return data[0].status === desiredStatus;
} 