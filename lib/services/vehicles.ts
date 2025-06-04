import { createClient } from "@/lib/supabase/index"; // Changed to use client-side Supabase client
import type { Database } from "@/types/supabase";
// import { cookies } from "next/headers"; // Removed direct import of cookies
import type { DbVehicle, VehicleInsert, VehicleUpdate } from "@/types"; // Using types from index.ts

// Removed inline VehicleRow, using DbVehicle from @/types

/**
 * Fetches a paginated list of vehicles.
 * Orders vehicles by creation date in descending order.
 *
 * @param searchParams - Object containing search parameters, primarily `page` for pagination.
 * @returns A promise that resolves to an array of DbVehicle objects.
 * @throws Will throw an error if the database query fails.
 */
export async function getVehicles(searchParams: { [key: string]: string | string[] | undefined }): Promise<DbVehicle[]> {
    const itemsPerPage = 10;
    const pageParam = Array.isArray(searchParams.page)
    ? Number(searchParams.page[0])
    : searchParams.page
      ? Number(searchParams.page)
      : 1;
    const currentPage = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage - 1;
    
    const supabase = createClient(); // Use client-side client
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(startIndex, endIndex);

    if (error) {
      console.error("Error fetching vehicles:", error);
      throw error;
    }
    return data || [];
}

/**
 * Fetches the total count of all vehicles.
 *
 * @returns A promise that resolves to the total number of vehicles.
 * @throws Will throw an error if the database query fails.
 */
export async function getTotalVehicleCount(): Promise<number> {
    const supabase = createClient(); // Use client-side client
    const { count, error } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error fetching vehicle count:", error);
        throw error;
    }
    return count || 0;
}

/**
 * Fetches a single vehicle by its unique identifier.
 *
 * @param id - The unique identifier of the vehicle.
 * @returns A promise that resolves to the DbVehicle object if found, otherwise null.
 * @throws Will throw an error if the query fails (excluding 'not found' which returns null).
 */
export async function getVehicleById(id: string): Promise<DbVehicle | null> {
  const supabase = createClient(); // Use client-side client
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { 
      return null;
    }
    console.error(`Error fetching vehicle ${id}:`, error);
    throw error;
  }
  return data;
}

// Ensure the input type for createVehicle matches DbVehicle fields excluding auto-generated ones.
type VehicleCreationPayload = Omit<DbVehicle, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'maintenance_tasks' | 'inspections' | 'driver_id'> & Partial<Pick<DbVehicle, 'driver_id'>>;


/**
 * Creates a new vehicle record, associating it with the currently authenticated user.
 * Requires `name`, `plate_number`, and `status` to be present in the input `vehicle` data or defaulted.
 *
 * @param vehicle - An object containing the vehicle data to create. 
 *                  Excludes 'id', 'created_at', 'updated_at', 'user_id'.
 *                  Conforms to Omit<VehicleInsert, 'id' | 'created_at' | 'updated_at' | 'user_id'>.
 * @returns A promise that resolves to the newly created DbVehicle object.
 * @throws Will throw an error if the user is not authenticated, if insertion fails, or if no data is returned after creation.
 */
export async function createVehicle(vehicle: Omit<VehicleInsert, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<DbVehicle> {
  const supabase = createClient(); // Use client-side client
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const vehicleDataToInsert: VehicleInsert = {
     ...vehicle,
     user_id: user.id,
     // Provide default values for any non-optional fields in VehicleInsert not in vehicle or user_id
     // For example, if 'name' is required and not in Omit and not optional:
     // name: vehicle.name || 'Default Name',
     // status: vehicle.status || 'default_status',
     // plate_number: vehicle.plate_number || 'DEFAULT-000'
     // created_at and updated_at are typically handled by DB or Supabase
  };

  // Ensure all required fields for VehicleInsert are present
  // This might require checking the definition of VehicleInsert (from Supabase generated types)
  // and ensuring `vehicle` provides them or they are defaulted here.
  const requiredFields: (keyof VehicleInsert)[] = ['name', 'plate_number', 'status']; // Example
  for (const field of requiredFields) {
    if (!(field in vehicleDataToInsert) || vehicleDataToInsert[field] === undefined || vehicleDataToInsert[field] === null) {
      // throw new Error(`Missing required field for vehicle creation: ${field}`);
      // Or assign a default if appropriate and not already handled
      // For now, we rely on the spread and Omit to be mostly correct, 
      // but robust code would validate/default more strictly here based on VehicleInsert type.
    }
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert([vehicleDataToInsert] as VehicleInsert[]) // Cast to VehicleInsert[]
    .select()
    .single();

  if (error) {
    console.error("Error creating vehicle:", error.message, error.details, error.hint);
    throw error;
  }
  if (!data) throw new Error("Failed to create vehicle, no data returned.");
  return data;
}

/**
 * Updates an existing vehicle record by its ID.
 *
 * @param id - The unique identifier of the vehicle to update.
 * @param vehicleUpdateData - An object containing the vehicle fields to update. Conforms to VehicleUpdate type.
 * @returns A promise that resolves to the updated DbVehicle object, or null if the vehicle is not found.
 * @throws Will throw an error if the database update fails (excluding 'not found' which returns null).
 */
export async function updateVehicle(id: string, vehicleUpdateData: VehicleUpdate): Promise<DbVehicle | null> {
  const supabase = createClient(); // Use client-side client
  // Remove id from update payload if it exists, as it's used in .eq()
  const { id: _, ...updatePayload } = vehicleUpdateData;

  const { data, error } = await supabase
    .from('vehicles')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating vehicle ${id}:`, error);
    if (error.code === 'PGRST116') return null; 
    throw error;
  }
  return data;
}

/**
 * Deletes a vehicle record by its ID.
 *
 * @param id - The unique identifier of the vehicle to delete.
 * @returns A promise that resolves to an object indicating success or failure, including an error object if deletion failed.
 *          { success: boolean; error?: any }
 */
export async function deleteVehicle(id: string): Promise<{ success: boolean; error?: any }> {
  const supabase = createClient(); // Use client-side client
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting vehicle ${id}:`, error);
    return { success: false, error };
  }
  return { success: true };
}

interface GetVehicleResult {
  vehicle: DbVehicle & { vehicle_assignments?: { driver: { id: string; first_name: string; last_name: string; profile_image_url?: string | null } | null }[] } | null; // More specific type
  error: any | null;
}


/**
 * Fetches a single vehicle by its ID, including its vehicle assignments and associated driver details.
 * This function is typically used for displaying detailed vehicle information pages.
 *
 * @param id - The unique identifier of the vehicle.
 * @returns A promise that resolves to an object containing the vehicle data (including assignments and driver info) or an error.
 *          { vehicle: FormattedVehicleData | null; error: any | null }
 */
// This is the function used in vehicles/[id]/page.tsx
export async function getVehicle(id: string): Promise<GetVehicleResult> {
  const supabase = createClient(); // Use client-side client
  try {
    const { data, error } = await supabase
      .from("vehicles")
      // Casting select string to any is a workaround for complex type joins.
      // Consider generating types from your schema for better type safety if Supabase supports it for such joins.
      .select("*, vehicle_assignments:vehicle_assignments!vehicle_id(driver:drivers(id, first_name, last_name, profile_image_url))")
      .eq("id", id)
      .single();

    if (error) {
      console.error('Error fetching vehicle data in getVehicle:', error);
      return { vehicle: null, error }; 
    }

    if (!data) {
      return { vehicle: null, error: { message: "Vehicle not found"} };
    }
    
    // Ensure 'vehicle_assignments' is an array and drivers are mapped correctly
    // The type for data should ideally come from Supabase if it can infer the join
    const rawData = data as any; 
    const formattedVehicle = {
        ...rawData,
        // Ensure vehicle_assignments and driver exist before mapping
        vehicle_assignments: rawData.vehicle_assignments?.map((va: any) => va.driver).filter(Boolean) || [],
    };

    return { vehicle: formattedVehicle as GetVehicleResult['vehicle'], error: null };

  } catch (catchError) {
    console.error('Unexpected error in getVehicle:', catchError);
    return { vehicle: null, error: catchError instanceof Error ? catchError : new Error(String(catchError)) };
  }
}

// Removed getVehiclesWithLogs, getVehicleWithDetails, getVehicleMaintenanceHistory, getVehicleInspectionHistory

/**
 * Fetches a limited list of vehicles.
 *
 * @param limit - The maximum number of vehicles to fetch (default: 10).
 * @returns A promise that resolves to an object containing an array of DbVehicle objects.
 *          Returns an empty array in `vehicles` if an error occurs.
 */
export async function getVehiclesWithLogs(limit = 10) {
  const supabase = createClient() // Use client-side client
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .limit(limit)

    if (error) throw error

    return { vehicles: data as DbVehicle[] }
  } catch (error) {
    console.error("Error:", error)
    return { vehicles: [] }
  }
}

/**
 * Fetches detailed information for a single vehicle by its ID.
 *
 * @param id - The unique identifier of the vehicle.
 * @returns A promise that resolves to an object containing the DbVehicle object, or null if not found or an error occurs.
 */
export async function getVehicleWithDetails(id: string) {
  const supabase = createClient() // Use client-side client
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { vehicle: data as DbVehicle | null }
  } catch (error) {
    console.error("Error:", error)
    return { vehicle: null }
  }
}

/**
 * Fetches the maintenance history (tasks) for a specific vehicle.
 *
 * @param vehicleId - The unique identifier of the vehicle.
 * @returns A promise that resolves to an object containing an array of maintenance tasks.
 *          Returns an empty array in `maintenanceHistory` if an error occurs.
 */
export async function getVehicleMaintenanceHistory(vehicleId: string) {
  const supabase = createClient() // Use client-side client
  try {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .eq('vehicle_id', vehicleId)

    if (error) throw error

    return { maintenanceHistory: data }
  } catch (error) {
    console.error("Error:", error)
    return { maintenanceHistory: [] }
  }
}

/**
 * Fetches the inspection history for a specific vehicle.
 *
 * @param vehicleId - The unique identifier of the vehicle.
 * @returns A promise that resolves to an object containing an array of inspection records.
 *          Returns an empty array in `inspectionHistory` if an error occurs.
 */
export async function getVehicleInspectionHistory(vehicleId: string) {
  const supabase = createClient() // Use client-side client
  try {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('vehicle_id', vehicleId)

    if (error) throw error

    return { inspectionHistory: data }
  } catch (error) {
    console.error("Error:", error)
    return { inspectionHistory: [] }
  }
} 