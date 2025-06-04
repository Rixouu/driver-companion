import { createServiceClient } from "@/lib/supabase/service-client"
import type { Database } from "@/types/supabase"
import { addDays, addWeeks, addMonths, addYears } from "date-fns"

export type MaintenanceSchedule = Database['public']['Tables']['maintenance_schedules']['Row']
export type InspectionSchedule = Database['public']['Tables']['inspection_schedules']['Row']
export type MaintenanceScheduleInsert = Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>
export type InspectionScheduleInsert = Omit<InspectionSchedule, 'id' | 'created_at' | 'updated_at'>

// Define insert types for tasks and inspections
export type MaintenanceTask = Database['public']['Tables']['maintenance_tasks']['Row']
export type MaintenanceTaskInsert = Omit<MaintenanceTask, 'id' | 'created_at' | 'updated_at' | 'vehicle'> & {
  notes?: string | null
  cost?: number | null
  estimated_duration?: number | null
  completed_date?: string | null
  service_provider_id?: string | null
  inspection_id?: string | null
  started_at?: string | null
  category?: string | null
  component_id?: string | null
}

export type Inspection = Database['public']['Tables']['inspections']['Row']
export type InspectionInsert = Omit<Inspection, 'id' | 'created_at' | 'updated_at' | 'vehicle' | 'user_id'> & {
  notes?: string | null
  inspector_id?: string | null
  inspection_template_id?: string | null
}

/**
 * Calculates the next due date for a scheduled event based on its start date and frequency.
 *
 * @param startDate - The initial start date of the event, either as a string or a Date object.
 * @param frequency - A string representing the recurrence frequency (e.g., 'daily', 'weekly', 'monthly', 'custom').
 * @param intervalDays - Optional. If frequency is 'custom', this specifies the number of days in the interval. Defaults to 30 if not provided for 'custom'.
 * @returns A Date object representing the next due date.
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
 * Retrieves all active maintenance schedules associated with a specific user.
 * Each schedule includes basic information about the linked vehicle.
 *
 * @param userId - The unique identifier of the user whose maintenance schedules are to be fetched.
 * @returns A promise that resolves to an array of MaintenanceSchedule objects. Returns an empty array if no schedules are found or in case of an error.
 * @throws Will throw an error if the database query fails, allowing the caller to handle it.
 */
export async function getMaintenanceSchedules(userId: string): Promise<MaintenanceSchedule[]> {
  const supabase = createServiceClient()
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
    throw error
  }
  return data || []
}

/**
 * Retrieves all active maintenance schedules for a specific vehicle.
 * Each schedule includes basic information about the linked vehicle itself (though somewhat redundant in this context).
 *
 * @param vehicleId - The unique identifier of the vehicle whose maintenance schedules are to be fetched.
 * @returns A promise that resolves to an array of MaintenanceSchedule objects. Returns an empty array if no schedules are found or in case of an error.
 * @throws Will throw an error if the database query fails.
 */
export async function getVehicleMaintenanceSchedules(vehicleId: string): Promise<MaintenanceSchedule[]> {
  const supabase = createServiceClient()
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
    throw error
  }
  return data || []
}

/**
 * Retrieves a single maintenance schedule by its unique identifier.
 * Includes details of the associated vehicle and any linked maintenance task template.
 *
 * @param id - The unique identifier of the maintenance schedule.
 * @returns A promise that resolves to the MaintenanceSchedule object if found, otherwise null.
 * @throws Will throw an error if the database query fails (excluding 'not found' errors which return null).
 */
export async function getMaintenanceSchedule(id: string): Promise<MaintenanceSchedule | null> {
  const supabase = createServiceClient()
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
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

/**
 * Creates a new maintenance schedule in the database.
 *
 * @param schedule - An object containing the details of the maintenance schedule to be created. 
 *                   Should conform to MaintenanceScheduleInsert type (omitting id, created_at, updated_at).
 * @returns A promise that resolves to the newly created MaintenanceSchedule object, or null if creation fails.
 * @throws Will throw an error if the database insertion fails.
 */
export async function createMaintenanceSchedule(schedule: MaintenanceScheduleInsert): Promise<MaintenanceSchedule | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .insert(schedule)
    .select()
    .single()

  if (error) {
    console.error('Error creating maintenance schedule:', error)
    throw error
  }
  return data
}

/**
 * Updates an existing maintenance schedule with the provided data.
 *
 * @param id - The unique identifier of the maintenance schedule to update.
 * @param schedule - An object containing a partial set of fields to update on the schedule. 
 *                   Should conform to Partial<MaintenanceScheduleInsert>.
 * @returns A promise that resolves to the updated MaintenanceSchedule object, or null if the schedule is not found or update fails.
 * @throws Will throw an error if the database update fails (excluding 'not found' errors which return null).
 */
export async function updateMaintenanceSchedule(
  id: string,
  schedule: Partial<MaintenanceScheduleInsert>
): Promise<MaintenanceSchedule | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .update(schedule)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating maintenance schedule:', error)
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

/**
 * Deletes a maintenance schedule from the database.
 *
 * @param id - The unique identifier of the maintenance schedule to delete.
 * @returns A promise that resolves when the deletion is successful.
 * @throws Will throw an error if the database deletion fails (excluding 'not found' errors, which are treated as success).
 */
export async function deleteMaintenanceSchedule(id: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('maintenance_schedules')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting maintenance schedule:', error)
    if (error.code === 'PGRST116') return // Not found, already deleted
    throw error
  }
}

/**
 * Retrieves all active inspection schedules associated with a specific user.
 * Each schedule includes basic information about the linked vehicle.
 *
 * @param userId - The unique identifier of the user whose inspection schedules are to be fetched.
 * @returns A promise that resolves to an array of InspectionSchedule objects. Returns an empty array if no schedules are found or in case of an error.
 * @throws Will throw an error if the database query fails.
 */
export async function getInspectionSchedules(userId: string): Promise<InspectionSchedule[]> {
  const supabase = createServiceClient()
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
    throw error
  }
  return data || []
}

/**
 * Retrieves all active inspection schedules for a specific vehicle.
 * Each schedule includes basic information about the linked vehicle.
 *
 * @param vehicleId - The unique identifier of the vehicle whose inspection schedules are to be fetched.
 * @returns A promise that resolves to an array of InspectionSchedule objects. Returns an empty array if no schedules are found or in case of an error.
 * @throws Will throw an error if the database query fails.
 */
export async function getVehicleInspectionSchedules(vehicleId: string): Promise<InspectionSchedule[]> {
  const supabase = createServiceClient()
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
    throw error
  }
  return data || []
}

/**
 * Retrieves a single inspection schedule by its unique identifier.
 * Includes details of the associated vehicle.
 *
 * @param id - The unique identifier of the inspection schedule.
 * @returns A promise that resolves to the InspectionSchedule object if found, otherwise null.
 * @throws Will throw an error if the database query fails (excluding 'not found' errors which return null).
 */
export async function getInspectionSchedule(id: string): Promise<InspectionSchedule | null> {
  const supabase = createServiceClient()
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
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

/**
 * Creates a new inspection schedule in the database.
 *
 * @param schedule - An object containing the details of the inspection schedule to be created. 
 *                   Should conform to InspectionScheduleInsert type.
 * @returns A promise that resolves to the newly created InspectionSchedule object, or null if creation fails.
 * @throws Will throw an error if the database insertion fails.
 */
export async function createInspectionSchedule(schedule: InspectionScheduleInsert): Promise<InspectionSchedule | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('inspection_schedules')
    .insert(schedule)
    .select()
    .single()

  if (error) {
    console.error('Error creating inspection schedule:', error)
    throw error
  }
  return data
}

/**
 * Updates an existing inspection schedule with the provided data.
 *
 * @param id - The unique identifier of the inspection schedule to update.
 * @param schedule - An object containing a partial set of fields to update on the schedule. 
 *                   Should conform to Partial<InspectionScheduleInsert>.
 * @returns A promise that resolves to the updated InspectionSchedule object, or null if the schedule is not found or update fails.
 * @throws Will throw an error if the database update fails (excluding 'not found' errors which return null).
 */
export async function updateInspectionSchedule(
  id: string,
  schedule: Partial<InspectionScheduleInsert>
): Promise<InspectionSchedule | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('inspection_schedules')
    .update(schedule)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating inspection schedule:', error)
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

/**
 * Deletes an inspection schedule from the database.
 *
 * @param id - The unique identifier of the inspection schedule to delete.
 * @returns A promise that resolves when the deletion is successful.
 * @throws Will throw an error if the database deletion fails (excluding 'not found' errors, which are treated as success).
 */
export async function deleteInspectionSchedule(id: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('inspection_schedules')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting inspection schedule:', error)
    if (error.code === 'PGRST116') return // Not found, already deleted
    throw error
  }
}

/**
 * Generates maintenance tasks based on active maintenance schedules.
 * It checks each schedule, calculates the next due date, and if it's in the past or present,
 * creates a new maintenance task. The schedule's last_generated_date is updated.
 * This function is intended to be run periodically (e.g., by a cron job).
 *
 * @returns A promise that resolves when the process is complete. The actual return (e.g. IDs of created tasks) might vary based on implementation details.
 * @throws Will throw an error if fetching schedules or inserting tasks fails.
 */
export async function generateMaintenanceTasks() {
  const supabase = createServiceClient()
  console.log('Generating maintenance tasks...')
  const { data: schedules, error: fetchError } = await supabase
    .from('maintenance_schedules')
    .select('*')
    .eq('is_active', true)

  if (fetchError) {
    console.error('Error fetching maintenance schedules for generation:', fetchError)
    throw fetchError
  }

  if (!schedules || schedules.length === 0) {
    console.log('No active maintenance schedules found for generation.')
    return
  }

  const tasksToCreate: MaintenanceTaskInsert[] = []
  const today = new Date()

  for (const schedule of schedules) {
    const nextDueDate = calculateNextDueDate(schedule.last_generated_date || schedule.start_date, schedule.frequency, schedule.interval_days || undefined)
    
    if (nextDueDate <= today) {
      tasksToCreate.push({
        vehicle_id: schedule.vehicle_id,
        task_name: schedule.task_name,
        description: schedule.description,
        due_date: nextDueDate.toISOString(),
        status: 'pending',
        priority: schedule.priority || 'medium',
        // TODO: Link to maintenance_task_templates if schedule.template_id exists
        // category: schedule.template_id ? (await supabase.from('maintenance_task_templates').select('category').eq('id', schedule.template_id).single())?.data?.category : 'general' 
      });

      // Update last_generated_date for the schedule
      const { error: updateError } = await supabase
        .from('maintenance_schedules')
        .update({ last_generated_date: today.toISOString() })
        .eq('id', schedule.id)
      
      if (updateError) {
        console.warn(`Failed to update last_generated_date for schedule ${schedule.id}:`, updateError)
      }
    }
  }

  if (tasksToCreate.length > 0) {
    const { error: insertError } = await supabase.from('maintenance_tasks').insert(tasksToCreate)
    if (insertError) {
      console.error('Error inserting generated maintenance tasks:', insertError)
      // Decide if to throw, or just log and continue for other potential operations
    } else {
      console.log(`Successfully generated ${tasksToCreate.length} maintenance tasks.`)
    }
  } else {
    console.log('No maintenance tasks due for generation.')
  }
}

/**
 * Generates inspection tasks based on active inspection schedules.
 * It checks each schedule, calculates the next due date, and if it's in the past or present,
 * creates a new inspection task. The schedule's last_generated_date is updated.
 * This function is intended to be run periodically (e.g., by a cron job).
 *
 * @returns A promise that resolves when the process is complete. The actual return (e.g. IDs of created tasks) might vary based on implementation details.
 * @throws Will throw an error if fetching schedules or inserting tasks fails.
 */
export async function generateInspectionTasks() {
  const supabase = createServiceClient()
  console.log('Generating inspection tasks...')
  const { data: schedules, error: fetchError } = await supabase
    .from('inspection_schedules')
    .select('*')
    .eq('is_active', true)

  if (fetchError) {
    console.error('Error fetching inspection schedules for generation:', fetchError)
    throw fetchError
  }

  if (!schedules || schedules.length === 0) {
    console.log('No active inspection schedules found for generation.')
    return
  }

  const inspectionsToCreate: InspectionInsert[] = []
  const today = new Date()

  for (const schedule of schedules) {
    const nextDueDate = calculateNextDueDate(schedule.last_generated_date || schedule.start_date, schedule.frequency, schedule.interval_days || undefined)

    if (nextDueDate <= today) {
      inspectionsToCreate.push({
        vehicle_id: schedule.vehicle_id,
        type: schedule.inspection_type || 'routine', // Default type if not specified
        date: nextDueDate.toISOString(),
        status: 'pending',
        notes: schedule.notes,
        inspector_id: null, // Or assign based on some logic if available
        // TODO: Link to inspection_templates if schedule.template_id exists
        // inspection_template_id: schedule.template_id 
      });

      // Update last_generated_date for the schedule
      const { error: updateError } = await supabase
        .from('inspection_schedules')
        .update({ last_generated_date: today.toISOString() })
        .eq('id', schedule.id)

      if (updateError) {
        console.warn(`Failed to update last_generated_date for inspection schedule ${schedule.id}:`, updateError)
      }
    }
  }

  if (inspectionsToCreate.length > 0) {
    const { error: insertError } = await supabase.from('inspections').insert(inspectionsToCreate)
    if (insertError) {
      console.error('Error inserting generated inspection tasks:', insertError)
    } else {
      console.log(`Successfully generated ${inspectionsToCreate.length} inspection tasks.`)
    }
  } else {
    console.log('No inspection tasks due for generation.')
  }
} 