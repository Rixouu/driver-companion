import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

export type MaintenanceTaskTemplate = Database['public']['Tables']['maintenance_task_templates']['Row']

/**
 * Fetches all maintenance task templates
 */
export async function getMaintenanceTaskTemplates() {
  const { data, error } = await supabase
    .from('maintenance_task_templates')
    .select('*')
    .order('title')

  if (error) {
    console.error('Error fetching maintenance task templates:', error)
    return { templates: [], error }
  }

  return { templates: data as MaintenanceTaskTemplate[], error: null }
}

/**
 * Fetches maintenance task templates by category
 */
export async function getMaintenanceTaskTemplatesByCategory(category: string) {
  const { data, error } = await supabase
    .from('maintenance_task_templates')
    .select('*')
    .eq('category', category)
    .order('title')

  if (error) {
    console.error('Error fetching maintenance task templates by category:', error)
    return { templates: [], error }
  }

  return { templates: data as MaintenanceTaskTemplate[], error: null }
}

/**
 * Fetches a single maintenance task template by ID
 */
export async function getMaintenanceTaskTemplate(id: string) {
  const { data, error } = await supabase
    .from('maintenance_task_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching maintenance task template:', error)
    return { template: null, error }
  }

  return { template: data as MaintenanceTaskTemplate, error: null }
}

/**
 * Creates a new maintenance task template
 */
export async function createMaintenanceTaskTemplate(template: Omit<MaintenanceTaskTemplate, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('maintenance_task_templates')
    .insert(template)
    .select()
    .single()

  if (error) {
    console.error('Error creating maintenance task template:', error)
    return { template: null, error }
  }

  return { template: data as MaintenanceTaskTemplate, error: null }
}

/**
 * Updates an existing maintenance task template
 */
export async function updateMaintenanceTaskTemplate(
  id: string,
  template: Partial<Omit<MaintenanceTaskTemplate, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('maintenance_task_templates')
    .update(template)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating maintenance task template:', error)
    return { template: null, error }
  }

  return { template: data as MaintenanceTaskTemplate, error: null }
}

/**
 * Deletes a maintenance task template
 */
export async function deleteMaintenanceTaskTemplate(id: string) {
  const { error } = await supabase
    .from('maintenance_task_templates')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting maintenance task template:', error)
    return { error }
  }

  return { error: null }
}

/**
 * Gets all unique categories for maintenance task templates
 */
export async function getMaintenanceTaskTemplateCategories() {
  const { data, error } = await supabase
    .from('maintenance_task_templates')
    .select('category')
    .order('category')

  if (error) {
    console.error('Error fetching maintenance task template categories:', error)
    return { categories: [], error }
  }

  // Extract unique categories
  const categories = [...new Set(data.map(item => item.category))]

  return { categories, error: null }
} 