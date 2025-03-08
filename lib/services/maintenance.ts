import { supabase } from "@/lib/supabase"
import type { DbMaintenanceTask } from "@/types"

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
        vin
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
  return { tasks: data as DbMaintenanceTask[], count }
}

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
        vin
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as DbMaintenanceTask
}

export async function createMaintenanceTask(task: Omit<DbMaintenanceTask, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .insert(task)
    .select()
    .single()

  return { data: data as DbMaintenanceTask | null, error }
}

export async function updateMaintenanceTask(id: string, task: Partial<DbMaintenanceTask>) {
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .update(task)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DbMaintenanceTask
}

export async function deleteMaintenanceTask(id: string) {
  const { error } = await supabase
    .from('maintenance_tasks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

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
        vin
      )
    `)
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as DbMaintenanceTask[]
} 