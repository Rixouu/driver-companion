import { getSupabaseClient } from '@/lib/db/client'
import type { Database } from '@/types/supabase'

type MaintenanceTask = Database['public']['Tables']['maintenance_tasks']['Row']
type MaintenanceTaskInsert = Database['public']['Tables']['maintenance_tasks']['Insert']
type MaintenanceTaskUpdate = Database['public']['Tables']['maintenance_tasks']['Update']

export async function getMaintenanceTasks() {
  const { data, error } = await getSupabaseClient()
    .from('maintenance_tasks')
    .select(`
      *,
      vehicle:vehicles (
        id,
        name,
        plate_number
      )
    `)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data
}

export async function updateMaintenanceStatus(id: string, status: MaintenanceTask['status']) {
  const { data, error } = await getSupabaseClient()
    .from('maintenance_tasks')
    .update({ 
      status,
      completed_date: status === 'completed' ? new Date().toISOString() : null
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMaintenanceTaskById(id: string) {
  const { data, error } = await getSupabaseClient()
    .from('maintenance_tasks')
    .select(`
      *,
      vehicle:vehicles (
        id,
        name,
        plate_number
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createMaintenanceTask(task: MaintenanceTaskInsert) {
  const { data, error } = await getSupabaseClient()
    .from('maintenance_tasks')
    .insert([task])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMaintenanceTask(id: string, data: MaintenanceTaskUpdate) {
  const { data: task, error } = await getSupabaseClient()
    .from('maintenance_tasks')
    .update({
      vehicle_id: data.vehicle_id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      due_date: data.due_date,
      status: data.status,
      estimated_duration: data.estimated_duration,
      cost: data.cost,
      notes: data.notes,
      completed_date: data.status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return task
} 