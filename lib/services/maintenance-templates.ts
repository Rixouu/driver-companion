"use server";

import { createServiceClient } from '@/lib/supabase';
import type { Database } from "@/types/supabase"; // Keep this for the Row type

// Define types locally
export type MaintenanceTaskTemplate = Database['public']['Tables']['maintenance_task_templates']['Row'];
export type MaintenanceTaskTemplateInsert = Omit<MaintenanceTaskTemplate, 'id' | 'created_at' | 'updated_at'>;

/**
 * Fetches all maintenance task templates from the database.
 *
 * @returns A promise that resolves to an array of MaintenanceTaskTemplate objects. 
 *          Returns an empty array if an error occurs during fetching.
 */
export async function getMaintenanceTaskTemplates(): Promise<MaintenanceTaskTemplate[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('maintenance_task_templates')
    .select('*');

  if (error) {
    console.error('Error fetching maintenance task templates:', error);
    return [];
  }

  return data as MaintenanceTaskTemplate[];
}

/**
 * Fetches maintenance task templates filtered by a specific category.
 *
 * @param category - The category name to filter templates by.
 * @returns A promise that resolves to an array of MaintenanceTaskTemplate objects matching the category.
 *          Returns an empty array if an error occurs or no templates match.
 */
export async function getMaintenanceTaskTemplatesByCategory(category: string): Promise<MaintenanceTaskTemplate[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('maintenance_task_templates')
    .select('*')
    .eq('category', category);

  if (error) {
    console.error('Error fetching maintenance task templates by category:', error);
    return [];
  }

  return data as MaintenanceTaskTemplate[];
}

/**
 * Fetches a single maintenance task template by its unique identifier.
 *
 * @param id - The unique identifier of the maintenance task template.
 * @returns A promise that resolves to the MaintenanceTaskTemplate object if found, otherwise null.
 */
export async function getMaintenanceTaskTemplate(id: string): Promise<MaintenanceTaskTemplate | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('maintenance_task_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching maintenance task template:', error);
    return null;
  }

  return data as MaintenanceTaskTemplate;
}

/**
 * Creates a new maintenance task template in the database.
 *
 * @param template - An object containing the details of the template to be created.
 *                   Should conform to MaintenanceTaskTemplateInsert type.
 * @returns A promise that resolves to the newly created MaintenanceTaskTemplate object, or null if creation fails.
 */
export async function createMaintenanceTaskTemplate(template: MaintenanceTaskTemplateInsert): Promise<MaintenanceTaskTemplate | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('maintenance_task_templates')
    .insert(template)
    .select()
    .single();

  if (error) {
    console.error('Error creating maintenance task template:', error);
    return null;
  }

  return data as MaintenanceTaskTemplate;
}

/**
 * Updates an existing maintenance task template with the provided data.
 *
 * @param id - The unique identifier of the template to update.
 * @param updates - An object containing a partial set of fields to update on the template.
 *                  Should conform to Partial<MaintenanceTaskTemplateInsert>.
 * @returns A promise that resolves to the updated MaintenanceTaskTemplate object, or null if the template is not found or update fails.
 */
export async function updateMaintenanceTaskTemplate(
  id: string,
  updates: Partial<MaintenanceTaskTemplateInsert>
): Promise<MaintenanceTaskTemplate | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('maintenance_task_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating maintenance task template:', error);
    return null;
  }

  return data as MaintenanceTaskTemplate;
}

/**
 * Deletes a maintenance task template from the database.
 *
 * @param id - The unique identifier of the template to delete.
 * @returns A promise that resolves to true if deletion was successful, false otherwise.
 */
export async function deleteMaintenanceTaskTemplate(id: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('maintenance_task_templates')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting maintenance task template:', error);
    return false;
  }

  return true;
}

/**
 * Retrieves all unique category names from the maintenance task templates.
 *
 * @returns A promise that resolves to an array of unique category strings.
 *          Returns an empty array if an error occurs or no categories are found.
 */
export async function getMaintenanceTaskTemplateCategories(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('maintenance_task_templates')
    .select('category');

  if (error) {
    console.error('Error fetching maintenance task template categories:', error);
    return [];
  }

  // Extract unique categories, filtering out null/undefined if they can occur
  const categories = [...new Set(data.map(item => item.category).filter(Boolean as any as (value: string | null | undefined) => value is string))];

  return categories;
}

/**
 * Fetches maintenance task templates associated with a specific vehicle type ID.
 * NOTE: This function is a placeholder and its implementation depends on the database schema
 * for linking templates to vehicle types (e.g., a join table or a direct foreign key).
 *
 * @param vehicleTypeId - The unique identifier of the vehicle type.
 * @returns A promise that resolves to an array of MaintenanceTaskTemplate objects. 
 *          Currently returns an empty array as it's not fully implemented.
 */
export async function getTemplatesForVehicleType(vehicleTypeId: string): Promise<MaintenanceTaskTemplate[]> {
  const supabase = createServiceClient();
  // This function's implementation relies on how templates are associated with vehicle types.
  // Assuming there's a join table like 'vehicle_type_maintenance_templates'
  // or a direct foreign key on 'maintenance_task_templates' if a template belongs to only one vehicle type.
  // Placeholder implementation - adjust based on your actual schema.
  console.warn(`getTemplatesForVehicleType for ${vehicleTypeId} is not fully implemented.`);
  // Example if there's a join table: vehicle_type_maintenance_template_links (vehicle_type_id, template_id)
  /*
  const { data, error } = await supabase
    .from('vehicle_type_maintenance_template_links')
    .select(`
      maintenance_task_templates (*)
    `)
    .eq('vehicle_type_id', vehicleTypeId);
  
  if (error) {
    console.error('Error fetching templates for vehicle type:', error);
    return [];
  }
  return data.map(item => item.maintenance_task_templates) as MaintenanceTaskTemplate[];
  */
  return []; 
}

/**
 * Associates a maintenance task template with a specific vehicle type.
 * NOTE: This function is a placeholder and its implementation depends on the database schema
 * for linking templates to vehicle types.
 *
 * @param templateId - The unique identifier of the template.
 * @param vehicleTypeId - The unique identifier of the vehicle type.
 * @returns A promise that resolves when the association is attempted.
 * @throws Will throw an error if the database operation (if implemented) fails.
 */
export async function addTemplateToVehicleType(templateId: string, vehicleTypeId: string): Promise<void> {
  const supabase = createServiceClient();
  // Similar to above, depends on schema. Placeholder.
  console.warn(`addTemplateToVehicleType for template ${templateId} to vehicle ${vehicleTypeId} is not fully implemented.`);
  // Example for a join table:
  /*
  const { error } = await supabase
    .from('vehicle_type_maintenance_template_links')
    .insert({ vehicle_type_id: vehicleTypeId, template_id: templateId });
  if (error) {
    console.error('Error adding template to vehicle type:', error);
    throw error;
  }
  */
} 