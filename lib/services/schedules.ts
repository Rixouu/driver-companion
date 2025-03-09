import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"
import { addDays, addWeeks, addMonths, addYears } from "date-fns"

export type MaintenanceSchedule = Database['public']['Tables']['maintenance_schedules']['Row']
export type InspectionSchedule = Database['public']['Tables']['inspection_schedules']['Row']

/**
 * Calculate the next due date based on frequency
 */
export function calculateNextDueDate(
  startDate: string | Date,
  frequency: string,
  intervalDays?: number
): Date {
  const baseDate = typeof startDate === 'string' ? new Date(startDate) : startDate
  
  switch (frequency) {
    case 'daily':
      return addDays(baseDate, 1)
    case 'weekly':
      return addDays(baseDate, 7)
    case 'biweekly':
      return addDays(baseDate, 14)
    case 'monthly':
      return addMonths(baseDate, 1)
    case 'quarterly':
      return addMonths(baseDate, 3)
    case 'biannually':
      return addMonths(baseDate, 6)
    case 'annually':
      return addYears(baseDate, 1)
    case 'custom':
      return addDays(baseDate, intervalDays || 30) // Default to 30 days if not specified
    default:
      return addDays(baseDate, 30) // Default to 30 days
  }
}

/**
 * Get all maintenance schedules for a user
 */
export async function getMaintenanceSchedules(userId: string) {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .select(`
      *,
      vehicle:vehicles(id, name, plate_number, brand, model, image_url)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Error fetching maintenance schedules:', error)
    return { schedules: [], error }
  }

  return { schedules: data, error: null }
}

/**
 * Get all maintenance schedules for a vehicle
 */
export async function getVehicleMaintenanceSchedules(vehicleId: string) {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .select(`
      *,
      vehicle:vehicles(id, name, plate_number, brand, model, image_url)
    `)
    .eq('vehicle_id', vehicleId)
    .eq('is_active', true)
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Error fetching vehicle maintenance schedules:', error)
    return { schedules: [], error }
  }

  return { schedules: data, error: null }
}

/**
 * Get a single maintenance schedule by ID
 */
export async function getMaintenanceSchedule(id: string) {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .select(`
      *,
      vehicle:vehicles(id, name, plate_number, brand, model, image_url),
      template:maintenance_task_templates(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching maintenance schedule:', error)
    return { schedule: null, error }
  }

  return { schedule: data, error: null }
}

/**
 * Create a new maintenance schedule
 */
export async function createMaintenanceSchedule(schedule: Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .insert(schedule)
    .select()
    .single()

  if (error) {
    console.error('Error creating maintenance schedule:', error)
    return { schedule: null, error }
  }

  return { schedule: data, error: null }
}

/**
 * Update a maintenance schedule
 */
export async function updateMaintenanceSchedule(
  id: string,
  schedule: Partial<Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .update(schedule)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating maintenance schedule:', error)
    return { schedule: null, error }
  }

  return { schedule: data, error: null }
}

/**
 * Delete a maintenance schedule
 */
export async function deleteMaintenanceSchedule(id: string) {
  const { error } = await supabase
    .from('maintenance_schedules')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting maintenance schedule:', error)
    return { error }
  }

  return { error: null }
}

/**
 * Get all inspection schedules for a user
 */
export async function getInspectionSchedules(userId: string) {
  const { data, error } = await supabase
    .from('inspection_schedules')
    .select(`
      *,
      vehicle:vehicles(id, name, plate_number, brand, model, image_url)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Error fetching inspection schedules:', error)
    return { schedules: [], error }
  }

  return { schedules: data, error: null }
}

/**
 * Get all inspection schedules for a vehicle
 */
export async function getVehicleInspectionSchedules(vehicleId: string) {
  const { data, error } = await supabase
    .from('inspection_schedules')
    .select(`
      *,
      vehicle:vehicles(id, name, plate_number, brand, model, image_url)
    `)
    .eq('vehicle_id', vehicleId)
    .eq('is_active', true)
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Error fetching vehicle inspection schedules:', error)
    return { schedules: [], error }
  }

  return { schedules: data, error: null }
}

/**
 * Get a single inspection schedule by ID
 */
export async function getInspectionSchedule(id: string) {
  const { data, error } = await supabase
    .from('inspection_schedules')
    .select(`
      *,
      vehicle:vehicles(id, name, plate_number, brand, model, image_url)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching inspection schedule:', error)
    return { schedule: null, error }
  }

  return { schedule: data, error: null }
}

/**
 * Create a new inspection schedule
 */
export async function createInspectionSchedule(schedule: Omit<InspectionSchedule, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('inspection_schedules')
    .insert(schedule)
    .select()
    .single()

  if (error) {
    console.error('Error creating inspection schedule:', error)
    return { schedule: null, error }
  }

  return { schedule: data, error: null }
}

/**
 * Update an inspection schedule
 */
export async function updateInspectionSchedule(
  id: string,
  schedule: Partial<Omit<InspectionSchedule, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('inspection_schedules')
    .update(schedule)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating inspection schedule:', error)
    return { schedule: null, error }
  }

  return { schedule: data, error: null }
}

/**
 * Delete an inspection schedule
 */
export async function deleteInspectionSchedule(id: string) {
  const { error } = await supabase
    .from('inspection_schedules')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting inspection schedule:', error)
    return { error }
  }

  return { error: null }
}

/**
 * Generate maintenance tasks from schedules
 * This should be called by a cron job or edge function
 */
export async function generateMaintenanceTasks() {
  const today = new Date()
  
  // Get all active schedules that need to generate tasks
  const { data: schedules, error } = await supabase
    .from('maintenance_schedules')
    .select(`
      *,
      vehicle:vehicles(id, name)
    `)
    .eq('is_active', true)
    .or(`last_generated_date.is.null,last_generated_date.lt.${today.toISOString().split('T')[0]}`)
    
  if (error) {
    console.error('Error fetching schedules for task generation:', error)
    return { success: false, error }
  }
  
  if (!schedules || schedules.length === 0) {
    return { success: true, tasksGenerated: 0 }
  }
  
  let tasksGenerated = 0
  
  // Process each schedule
  for (const schedule of schedules) {
    // Calculate next due date based on last generated date or start date
    const baseDate = schedule.last_generated_date || schedule.start_date
    const nextDueDate = calculateNextDueDate(baseDate, schedule.frequency, schedule.interval_days)
    
    // Skip if next due date is in the future
    if (nextDueDate > today) {
      continue
    }
    
    // Skip if end date is set and we've passed it
    if (schedule.end_date && new Date(schedule.end_date) < today) {
      // Deactivate the schedule
      await supabase
        .from('maintenance_schedules')
        .update({ is_active: false })
        .eq('id', schedule.id)
      
      continue
    }
    
    // Create a new maintenance task
    const { error: insertError } = await supabase
      .from('maintenance_tasks')
      .insert({
        vehicle_id: schedule.vehicle_id,
        title: schedule.title,
        description: schedule.description,
        priority: schedule.priority,
        due_date: nextDueDate.toISOString().split('T')[0],
        status: 'scheduled',
        estimated_duration: schedule.estimated_duration,
        cost: schedule.estimated_cost,
        notes: schedule.notes,
        user_id: schedule.user_id
      })
    
    if (insertError) {
      console.error('Error creating maintenance task from schedule:', insertError)
      continue
    }
    
    // Update the last generated date
    await supabase
      .from('maintenance_schedules')
      .update({ last_generated_date: nextDueDate.toISOString().split('T')[0] })
      .eq('id', schedule.id)
    
    // Create a notification
    await supabase
      .from('notifications')
      .insert({
        user_id: schedule.user_id,
        title: 'Scheduled Maintenance',
        message: `A maintenance task "${schedule.title}" has been scheduled for ${schedule.vehicle?.name || 'your vehicle'}.`,
        type: 'maintenance',
        related_id: schedule.id,
        due_date: nextDueDate.toISOString().split('T')[0]
      })
    
    tasksGenerated++
  }
  
  return { success: true, tasksGenerated }
}

/**
 * Generate inspection tasks from schedules
 * This should be called by a cron job or edge function
 */
export async function generateInspectionTasks() {
  const today = new Date()
  
  // Get all active schedules that need to generate tasks
  const { data: schedules, error } = await supabase
    .from('inspection_schedules')
    .select(`
      *,
      vehicle:vehicles(id, name)
    `)
    .eq('is_active', true)
    .or(`last_generated_date.is.null,last_generated_date.lt.${today.toISOString().split('T')[0]}`)
    
  if (error) {
    console.error('Error fetching schedules for inspection generation:', error)
    return { success: false, error }
  }
  
  if (!schedules || schedules.length === 0) {
    return { success: true, inspectionsGenerated: 0 }
  }
  
  let inspectionsGenerated = 0
  
  // Process each schedule
  for (const schedule of schedules) {
    // Calculate next due date based on last generated date or start date
    const baseDate = schedule.last_generated_date || schedule.start_date
    const nextDueDate = calculateNextDueDate(baseDate, schedule.frequency, schedule.interval_days)
    
    // Skip if next due date is in the future
    if (nextDueDate > today) {
      continue
    }
    
    // Skip if end date is set and we've passed it
    if (schedule.end_date && new Date(schedule.end_date) < today) {
      // Deactivate the schedule
      await supabase
        .from('inspection_schedules')
        .update({ is_active: false })
        .eq('id', schedule.id)
      
      continue
    }
    
    // Create a new inspection
    const { data: inspection, error: insertError } = await supabase
      .from('inspections')
      .insert({
        vehicle_id: schedule.vehicle_id,
        status: 'pending',
        user_id: schedule.user_id,
        type: schedule.type,
        date: nextDueDate.toISOString().split('T')[0]
      })
      .select()
      .single()
    
    if (insertError || !inspection) {
      console.error('Error creating inspection from schedule:', insertError)
      continue
    }
    
    // Update the last generated date
    await supabase
      .from('inspection_schedules')
      .update({ last_generated_date: nextDueDate.toISOString().split('T')[0] })
      .eq('id', schedule.id)
    
    // Create a notification
    await supabase
      .from('notifications')
      .insert({
        user_id: schedule.user_id,
        title: 'Scheduled Inspection',
        message: `An inspection "${schedule.title}" has been scheduled for ${schedule.vehicle?.name || 'your vehicle'}.`,
        type: 'inspection',
        related_id: schedule.id,
        due_date: nextDueDate.toISOString().split('T')[0]
      })
    
    inspectionsGenerated++
  }
  
  return { success: true, inspectionsGenerated }
} 