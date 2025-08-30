import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ServiceTypeInfo, PricingCategory, PricingItem } from '@/types/quotations';

/**
 * Fetches service types from the server.
 * This function is intended for server-side use, leveraging `getSupabaseServerClient`.
 *
 * @returns A promise that resolves to an array of ServiceTypeInfo objects (id, name), ordered by name.
 *          Returns an empty array if an error occurs during fetching.
 */
export async function getServerServiceTypes(): Promise<ServiceTypeInfo[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('service_types')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('[Server Service] Error fetching service types:', error);
    return [];
  }
  return data || [];
}

/**
 * Fetches pricing categories from the server.
 * This function is intended for server-side use.
 *
 * @returns A promise that resolves to an array of PricingCategory objects, ordered by `sort_order`.
 *          Returns an empty array if an error occurs during fetching.
 */
export async function getServerPricingCategories(): Promise<PricingCategory[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('pricing_categories')
    .select('*')
    .order('sort_order'); 

  if (error) {
    console.error('[Server Service] Error fetching pricing categories:', error);
    return [];
  }
  return data || [];
}

/**
 * Fetches pricing items from the server, optionally filtered by category ID.
 * Includes the name of the associated service type.
 * This function is intended for server-side use.
 *
 * @param categoryId - Optional. The ID of the pricing category to filter items by.
 * @returns A promise that resolves to an array of PricingItem objects, ordered by `vehicle_type`.
 *          Each item is enriched with `service_type_name`.
 *          Returns an empty array if an error occurs during fetching.
 */
export async function getServerPricingItems(categoryId?: string): Promise<PricingItem[]> {
  const supabase = await getSupabaseServerClient();
  let query = supabase
    .from('pricing_items')
    .select(`
      *,
      service_types (id, name)
    `)
    .order('duration_hours'); // Order by duration_hours instead of vehicle_type

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`[Server Service] Error fetching pricing items (category: ${categoryId || 'all'}):`, error);
    return [];
  }
  // Ensure the returned data conforms to PricingItem[]
  // Map data to include service_type_name from the joined service_types table
  const enrichedData = (data || []).map(item => {
    const serviceType = item.service_types as { id: string; name: string } | null; // Type assertion for clarity
    return {
      ...item,
      service_type_id: item.service_type_id, // Ensure this is mapped
      service_type_name: serviceType?.name || undefined, // Populate service_type_name
      service_types: undefined, // Remove the nested service_types object after extracting name
    } as PricingItem;
  });
  return enrichedData;
} 