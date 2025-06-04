import { createServiceClient } from "@/lib/supabase"
import type { DbMaintenanceTask, DbVehicle } from "@/types"

const supabase = createServiceClient()

/**
 * Fetches a paginated list of maintenance tasks, optionally filtered by status and search term.
 * Includes basic vehicle information for each task.
 *
 * @param options - Optional parameters for pagination, status filtering, and search.
 * @param options.page - The page number to fetch (default: 1).
 * @param options.status - The status to filter tasks by (e.g., 'pending', 'completed', 'all').
 * @param options.search - A search term to filter by task title or description.
 * @returns A promise that resolves to an object containing the list of tasks and the total count.
 * @throws Will throw an error if the database query fails.
 */
export async function getMaintenanceTasks(options?: {
  page?: number;
  status?: string;
  search?: string;
}) {
  const { page = 1, status = 'all', search = '' } = options || {}
  const itemsPerPage = 10
  
  let query = supabase
    .from('maintenance_tasks')
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
        user_id,
        created_at,
        updated_at
      )
    `, { count: 'exact' })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data, error, count } = await query
    .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
    .order('created_at', { ascending: false })

  if (error) throw error
  return { tasks: data as unknown as DbMaintenanceTask[], count }
}

/**
 * Fetches a single maintenance task by its ID, including associated vehicle information.
 *
 * @param id - The unique identifier of the maintenance task.
 * @returns A promise that resolves to the maintenance task object (DbMaintenanceTask).
 * @throws Will throw an error if the task is not found or the query fails.
 */
export async function getMaintenanceTaskById(id: string) {
  const { data, error } = await supabase
    .from('maintenance_tasks')
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
        user_id,
        created_at,
        updated_at
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as unknown as DbMaintenanceTask
}

/**
 * Creates a new maintenance task record.
 *
 * @param task - The maintenance task data to create. 
 *               Should exclude 'id', 'created_at', and 'updated_at' as these are auto-generated.
 *               Conforms to Omit<DbMaintenanceTask, 'id' | 'created_at' | 'updated_at'>.
 * @returns A promise that resolves to an object containing the newly created task data or an error.
 *          { data: DbMaintenanceTask | null, error: PostgrestError | null }
 */
export async function createMaintenanceTask(task: Omit<DbMaintenanceTask, 'id' | 'created_at' | 'updated_at'>) {
  const payload = {
    ...task,
    started_at: task.started_at === null ? undefined : task.started_at,
    completed_date: task.completed_date === null ? undefined : task.completed_date,
    cost: task.cost === null ? undefined : task.cost,
  };

  const { data, error } = await supabase
    .from('maintenance_tasks')
    .insert(payload)
    .select()
    .single()

  return { data: data as DbMaintenanceTask | null, error }
}

/**
 * Updates an existing maintenance task record.
 *
 * @param id - The unique identifier of the maintenance task to update.
 * @param task - An object containing the maintenance task fields to update.
 *               Conforms to Partial<DbMaintenanceTask>.
 * @returns A promise that resolves to the updated maintenance task object (DbMaintenanceTask).
 * @throws Will throw an error if the database update fails or the task is not found.
 */
export async function updateMaintenanceTask(id: string, task: Partial<DbMaintenanceTask>) {
  const payload: Partial<Omit<DbMaintenanceTask, 'id' | 'created_at' | 'updated_at' | 'vehicle' | 'vehicle_id'> & { vehicle_id?: string }> = {};

  for (const key in task) {
    if (Object.prototype.hasOwnProperty.call(task, key)) {
      const taskKey = key as keyof typeof task;
      if (taskKey === 'started_at' || taskKey === 'completed_date') {
        payload[taskKey] = task[taskKey] === null ? undefined : task[taskKey];
      } else if (taskKey === 'cost') {
        payload[taskKey] = task[taskKey] === null ? undefined : task[taskKey];
      } else if (taskKey !== 'id' && taskKey !== 'created_at' && taskKey !== 'updated_at' && taskKey !== 'vehicle') {
        payload[taskKey] = task[taskKey];
      }
    }
  }
  
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as unknown as DbMaintenanceTask
}

/**
 * Deletes a maintenance task record by its ID.
 *
 * @param id - The unique identifier of the maintenance task to delete.
 * @returns A promise that resolves when the deletion is successful.
 * @throws Will throw an error if the database deletion fails or the task is not found.
 */
export async function deleteMaintenanceTask(id: string) {
  const { error } = await supabase
    .from('maintenance_tasks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Fetches all maintenance tasks associated with a specific vehicle ID.
 * Includes basic vehicle information for each task and orders them by creation date (descending).
 *
 * @param vehicleId - The unique identifier of the vehicle.
 * @returns A promise that resolves to an array of maintenance task objects (DbMaintenanceTask[]).
 * @throws Will throw an error if the database query fails.
 */
export async function getVehicleMaintenanceTasks(vehicleId: string) {
  const { data, error } = await supabase
    .from('maintenance_tasks')
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
        user_id,
        created_at,
        updated_at
      )
    `)
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as unknown as DbMaintenanceTask[]
} 