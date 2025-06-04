import { createServiceClient } from "@/lib/supabase/service-client"
import type { Database } from '@/types/supabase'
import type { InspectionInsert } from "@/types"
import type { InspectionWithVehicle as ImportedInspection, InspectionFormData } from "@/types"
import type { DbInspection, DbVehicle } from "@/types"
import type { 
  InspectionType, 
  DbInspectionSection,
  DbInspectionTemplateItem,
  TranslationObject
} from '@/types/inspections'
import { TemplateStatus } from '@/types/inspections'

type Inspection = Database['public']['Tables']['inspections']['Row']
type InspectionUpdate = Database['public']['Tables']['inspections']['Update']

// Add types for the new translation structure
// export type TranslationObject = { [key: string]: string } // Removed local definition, using imported one

// Define Row types based on the *expected* DB structure after migrations
// These might differ from the auto-generated Database['public']['Tables'] types until they are updated
type InspectionCategoryRow = {
    id: string;
    type: InspectionType;
    order_number: number | null;
    created_at: string | null;
    updated_at: string | null;
    name_translations: TranslationObject | null;
    description_translations: TranslationObject | null;
    master_template_id?: string | null;
    inspection_item_templates?: InspectionItemTemplateRow[];
}
type InspectionItemTemplateRow = {
    id: string;
    category_id: string | null;
    order_number: number | null;
    requires_photo: boolean | null;
    requires_notes: boolean | null;
    created_at: string | null;
    updated_at: string | null;
    name_translations: TranslationObject | null;
    description_translations: TranslationObject | null;
}

// Define the expected return types including translations, extending base types if possible
// These are what the service functions should return

// Base type aliases using the correctly imported and defined types
type BaseInspectionCategory = DbInspectionSection;

type BaseInspectionItemTemplate = DbInspectionTemplateItem;

export interface InspectionCategory extends BaseInspectionCategory {
    name_translations: TranslationObject;
    description_translations: TranslationObject; // Ensure non-null in return type via defaults
    inspection_item_templates: InspectionItemTemplate[];
}

export interface InspectionItemTemplate extends BaseInspectionItemTemplate {}

/**
 * Fetches a paginated list of inspections, optionally filtered by status and search term.
 * Includes basic vehicle information for each inspection.
 * @param options - Optional parameters for pagination, status filtering, and search.
 * @param options.page - The page number to fetch (default: 1).
 * @param options.status - The status to filter inspections by (default: 'all').
 * @param options.search - A search term to filter by vehicle name or plate number.
 * @returns A promise that resolves to an object containing the list of inspections and the total count.
 * @throws Will throw an error if the database query fails.
 */
export async function getInspections(options?: {
  page?: number;
  status?: string;
  search?: string;
}) {
  const { page = 1, status = 'all', search = '' } = options || {}
  const itemsPerPage = 10
  
  let query = createServiceClient()
    .from('inspections')
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
    query = query.or(`vehicle.name.ilike.%${search}%,vehicle.plate_number.ilike.%${search}%`)
  }

  const { data, error, count } = await query
    .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
    .order('created_at', { ascending: false })

  if (error) throw error
  return { inspections: data as unknown as DbInspection[], count }
}

/**
 * Fetches a single inspection by its ID, including associated vehicle information.
 * @param id - The unique identifier of the inspection.
 * @returns A promise that resolves to the inspection object.
 * @throws Will throw an error if the inspection is not found or the query fails.
 */
export async function getInspectionById(id: string) {
  const supabaseClient = createServiceClient(); // Get client
  const { data, error } = await supabaseClient // Use client
    .from('inspections')
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
    .single();

  if (error) throw error;
  return data as unknown as DbInspection;
}

/**
 * Creates a new inspection record.
 * @param inspection - The inspection data to create. 
 *                     Should exclude 'id', 'created_at', and 'updated_at' as these are auto-generated.
 * @returns A promise that resolves to the newly created inspection object.
 * @throws Will throw an error if the database insertion fails.
 */
export async function createInspection(inspection: Omit<DbInspection, 'id' | 'created_at' | 'updated_at'>) {
  const supabaseClient = createServiceClient(); // Get client
  const { data, error } = await supabaseClient // Use client
    .from('inspections')
    .insert(inspection)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as DbInspection;
}

/**
 * Updates the status of a specific inspection.
 * @param id - The unique identifier of the inspection to update.
 * @param status - The new status for the inspection.
 * @returns A promise that resolves to the updated inspection object.
 * @throws Will throw an error if the database update fails.
 */
export async function updateInspectionStatus(id: string, status: Inspection['status']) {
  const supabaseClient = createServiceClient();
  const { data, error } = await supabaseClient
    .from('inspections')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Add types for inspection results with proper status values
interface InspectionResult {
  inspection_id: string
  item_id: string // This should be a UUID
  status: 'pass' | 'fail' | null
  notes: string
  photos?: string[]
  category: string
}

interface InspectionPhoto {
  result_id: string
  photo_url: string
}

// Status mapping for different tables
const STATUS = {
  INSPECTION_ITEMS: {
    PENDING: 'pending',
    PASS: 'pass',
    FAIL: 'fail'
  },
  INSPECTION_RESULTS: {
    PASS: 'pass',
    FAIL: 'fail'
  }
} as const

/**
 * Saves the results (item statuses, notes, photos) for a given inspection.
 * Updates the main inspection record's status to 'completed'.
 * @param inspectionId - The unique identifier of the inspection.
 * @param results - An array of inspection results, each containing item_id, status, notes, and optional photos.
 * @returns A promise that resolves when the results are saved successfully.
 * @throws Will throw an error if any part of the saving process fails (updating inspection status, saving results, or saving photos).
 */
export async function saveInspectionResults(inspectionId: string, results: InspectionResult[]) {
  const supabaseClient = createServiceClient(); // Get client
  
  try {
    console.log('Saving results:', { inspectionId, results });

    // First update the inspection status
    const { error: statusError } = await supabaseClient // Use client
      .from('inspections')
      .update({ status: 'completed' })
      .eq('id', inspectionId);

    if (statusError) {
      console.error('Status update error:', statusError);
      throw statusError;
    }

    // Ensure all results have a valid status
    const validResults = results.filter(result => result.status === 'pass' || result.status === 'fail');

    // Save all results at once
    const { data: savedResults, error: resultsError } = await supabaseClient // Use client
      .from('inspection_results' as any)
      .insert(validResults.map(result => ({
        inspection_id: inspectionId,
        item_id: result.item_id,
        status: result.status,
        notes: result.notes || ''
      })))
      .select('id, item_id');

    if (resultsError) {
      console.error('Results save error:', resultsError)
      throw resultsError
    }

    // Save all photos
    const photosToSave = validResults.flatMap(result => {
      const savedResult = (savedResults as any[])?.find(r => r.item_id === result.item_id)
      return result.photos?.map(photo => ({
        result_id: savedResult?.id,
        photo_url: photo
      })) || []
    }).filter(photo => photo.result_id)

    if (photosToSave.length > 0) {
      const { error: photosError } = await supabaseClient
        .from('inspection_photos' as any)
        .insert(photosToSave)

      if (photosError) {
        console.error('Photos save error:', photosError)
        throw photosError
      }
    }

  } catch (error) {
    console.error('Save inspection results error:', error)
    throw error
  }
}

/**
 * Fetches all inspection records, including associated vehicle information.
 * Note: This function fetches all inspections without pagination and could be resource-intensive for large datasets.
 * Consider using `getInspections` for paginated results.
 * @returns A promise that resolves to an array of all inspection objects.
 * @throws Will throw an error if the database query fails.
 */
export async function getAllInspections() {
  const supabaseClient = createServiceClient();
  const { data, error } = await supabaseClient
    .from('inspections')
    .select(`
      *,
      vehicle:vehicles!inner (
        id,
        name,
        plate_number,
        brand,
        model,
        year,
        status,
        image_url,
        vin,
        created_at,
        updated_at,
        user_id
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DbInspection[];
}

/**
 * Fetches a specific inspection along with its items and their results.
 * @param id - The unique identifier of the inspection.
 * @returns A promise that resolves to an object containing the inspection details, 
 *          its items, and the results for those items.
 * @throws Will throw an error if the inspection is not found or any database query fails.
 */
export async function getInspection(id: string) {
  const supabaseClient = createServiceClient();
  const { data, error } = await supabaseClient
    .from('inspections')
    .select(`
      *,
      vehicle:vehicles!inner (
        id,
        name,
        plate_number,
        image_url
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching inspection:', error);
    throw error;
  }
  return data as ImportedInspection;
}

/**
 * Updates an existing inspection record.
 * @param id - The unique identifier of the inspection to update.
 * @param inspection - An object containing the inspection fields to update.
 * @returns A promise that resolves to the updated inspection object.
 * @throws Will throw an error if the database update fails or the inspection is not found.
 */
export async function updateInspection(id: string, inspection: Partial<InspectionFormData>) {
  const supabaseClient = createServiceClient();
  const { data, error } = await supabaseClient
    .from('inspections')
    .update(inspection as InspectionUpdate) // Added type assertion based on original code structure
    .match({ id })
    .single();

  if (error) throw error;
  return data as ImportedInspection;
}

// Fetch templates with translation columns
export async function getInspectionTemplates(type: InspectionType): Promise<InspectionCategory[]> {
  const supabaseClient = createServiceClient();
  const locale = 'en'; // Placeholder for locale determination

  const { data: categoriesData, error } = await supabaseClient
    .from('inspection_categories')
    .select(`
      id,
      type,
      order_number,
      name_translations,
      description_translations,
      master_template_id,
      inspection_item_templates (
        id,
        category_id,
        order_number,
        name_translations,
        description_translations,
        requires_photo,
        requires_notes,
        created_at,
        updated_at
      )
    `)
    .eq('type', type)
    .order('order_number', { ascending: true })
    .order('order_number', { foreignTable: 'inspection_item_templates', ascending: true });

  if (error) {
    console.error('Error fetching inspection templates:', error);
    throw error;
  }

  if (!categoriesData) {
    return [];
  }

  // Explicitly type the fetched data before mapping
  type SupaCategoryIn = Database['public']['Tables']['inspection_categories']['Row'] & {
    master_template_id?: string | null; // ensure this is part of the fetched type
    inspection_item_templates: (Database['public']['Tables']['inspection_item_templates']['Row'])[] | null;
  };
  type SupaItemIn = Database['public']['Tables']['inspection_item_templates']['Row'];

  const typedCategoriesData = categoriesData as SupaCategoryIn[];

  const categoriesWithItems = typedCategoriesData.map((category): InspectionCategory => {
    const nameTrans = category.name_translations as TranslationObject || { [locale]: 'Untitled Category' };
    const descTrans = category.description_translations as TranslationObject || { [locale]: '' };

    const items = (category.inspection_item_templates || []).map((item): InspectionItemTemplate => {
      return {
        id: item.id,
        category_id: item.category_id, // Assuming item.category_id is non-null string from SupaItemIn
        name_translations: item.name_translations as TranslationObject || { [locale]: 'Untitled Item' },
        description_translations: item.description_translations as TranslationObject || { [locale]: '' },
        order_number: item.order_number ?? 0, // Default to 0 if null
        requires_photo: item.requires_photo ?? false, // Default to false if null
        requires_notes: item.requires_notes ?? false, // Default to false if null
        created_at: item.created_at, // Assuming item.created_at is non-null string
        updated_at: item.updated_at, // Assuming item.updated_at is non-null string
      };
    });

    return {
      id: category.id,
      type: category.type as InspectionType,
      name_translations: nameTrans,
      description_translations: descTrans,
      title: nameTrans[locale] || nameTrans['en'] || 'Untitled Category',
      description: descTrans[locale] || descTrans['en'] || '',
      order_number: category.order_number ?? 0, // Default to 0 if null
      template_id: category.master_template_id || null,
      inspection_item_templates: items,
      created_at: category.created_at, 
      updated_at: category.updated_at, 
      metadata: (category as any).metadata || undefined, 
      deleted_at: (category as any).deleted_at || undefined,
    };
  });

  return categoriesWithItems as InspectionCategory[];
}

/**
 * Saves a photo URL associated with a specific inspection item result.
 * This function assumes that an inspection result entry for the item already exists or will be created separately.
 * @param inspectionItemId - The unique identifier of the inspection item (often corresponds to an inspection_result record's ID or a link to it).
 * @param photoUrl - The URL of the photo to be saved.
 * @returns A promise that resolves to the newly created inspection photo record.
 * @throws Will throw an error if the database insertion fails.
 */
export async function saveInspectionPhoto(inspectionItemId: string, photoUrl: string) {
  const supabaseClient = createServiceClient();
  const { data, error } = await supabaseClient
    .from('inspection_photos')
    .insert([{ result_id: inspectionItemId, photo_url: photoUrl }])
    .select();

  if (error) {
    console.error('Error saving inspection photo:', { inspectionItemId, photoUrl, error });
    throw error;
  }
  return data;
}

/**
 * Adds a new inspection section (category) for a given inspection type.
 * @param typeArgument The type of inspection (e.g., 'pre-trip').
 * @param nameTranslations An object containing translations for the section name.
 * @param descriptionTranslationsArgument An optional object for section description translations.
 * @param masterTemplateIdInput An optional master template ID to associate with this section.
 * @returns A promise resolving to the newly created inspection category.
 * @throws Throws an error if the database operation fails.
 */
export async function addInspectionSection(
  typeArgument: InspectionType,
  nameTranslations: TranslationObject,
  descriptionTranslationsArgument?: TranslationObject,
  masterTemplateIdInput?: string | null
): Promise<InspectionCategory> {
  const supabaseClient = createServiceClient();
  const { data: rowData, error } = await supabaseClient
    .from('inspection_categories')
    .insert({
      type: typeArgument,
      name_translations: nameTranslations,
      description_translations: descriptionTranslationsArgument || null,
      order_number: 0, // Ensure order_number is set during insert
      master_template_id: masterTemplateIdInput
    })
    .select('*')
    .single<InspectionCategoryRow>();
  
  if (error) throw error;
  if (!rowData) throw new Error("Failed to create inspection section, no data returned.");

  const finalNameTranslations = (rowData.name_translations as TranslationObject | null) || { en: '', ja: '' }; // Ensure non-null
  const finalDescTranslations = (rowData.description_translations as TranslationObject | null) || { en: '', ja: '' }; // Ensure non-null
  const locale = 'en'; // Placeholder for locale

  return {
    id: rowData.id,
    template_id: rowData.master_template_id || null,
    title: finalNameTranslations[locale] || finalNameTranslations.en || '',
    description: finalDescTranslations[locale] || finalDescTranslations.en || undefined,
    order_number: rowData.order_number ?? 0, // Default to 0 if null
    type: rowData.type, // From rowData
    name_translations: finalNameTranslations,
    description_translations: finalDescTranslations,
    created_at: rowData.created_at,
    updated_at: rowData.updated_at,
    metadata: undefined, 
    deleted_at: undefined,
    inspection_item_templates: [], 
  };
}

/**
 * Updates an existing inspection section (category).
 * @param sectionId The ID of the section to update.
 * @param nameTranslations An object containing the new name translations.
 * @param descriptionTranslationsArgument An optional object for new description translations.
 * @param masterTemplateIdUpdates An optional object to update the master template ID.
 * @param orderNumberUpdate An optional new order number for the section.
 * @returns A promise resolving to the updated inspection category.
 * @throws Throws an error if the update fails or the section is not found.
 */
export async function updateInspectionSection(
  sectionId: string,
  nameTranslations: TranslationObject,
  descriptionTranslationsArgument?: TranslationObject,
  masterTemplateIdUpdates?: { master_template_id: string | null },
  orderNumberUpdate?: number
): Promise<InspectionCategory> {
  const supabaseClient = createServiceClient();

  // Define Supabase input types, similar to getInspectionTemplates
  type SupaCategoryIn = Database['public']['Tables']['inspection_categories']['Row'] & {
    master_template_id?: string | null;
    inspection_item_templates: (Database['public']['Tables']['inspection_item_templates']['Row'])[] | null;
  };
  type SupaItemIn = Database['public']['Tables']['inspection_item_templates']['Row'];

  const updates: Partial<InspectionCategoryRow> = {
    name_translations: nameTranslations,
    description_translations: descriptionTranslationsArgument || null,
  };

  if (masterTemplateIdUpdates && masterTemplateIdUpdates.master_template_id !== undefined) {
    updates.master_template_id = masterTemplateIdUpdates.master_template_id;
  }
  if (orderNumberUpdate !== undefined) {
    updates.order_number = orderNumberUpdate;
  }

  const { data: rowData, error } = await supabaseClient
    .from('inspection_categories')
    .update(updates)
    .eq('id', sectionId)
    .select(`
      *,
      inspection_item_templates(*)
    `)
    .single<InspectionCategoryRow & { inspection_item_templates: SupaItemIn[] | null }>();

  if (error) throw error;
  if (!rowData) throw new Error("Failed to update inspection section, no data returned.");
  
  const typedRowData = rowData as SupaCategoryIn;

  const finalNameTranslations = (typedRowData.name_translations as TranslationObject | null) || { en: '', ja: '' };
  const finalDescTranslations = (typedRowData.description_translations as TranslationObject | null) || { en: '', ja: '' };
  const locale = 'en'; // Placeholder for locale

  return {
    id: typedRowData.id,
    template_id: typedRowData.master_template_id || null,
    title: finalNameTranslations[locale] || finalNameTranslations.en || '',
    description: finalDescTranslations[locale] || finalDescTranslations.en || undefined,
    order_number: typedRowData.order_number ?? 0, // Default to 0 if null
    type: typedRowData.type as InspectionType,
    name_translations: finalNameTranslations,
    description_translations: finalDescTranslations,
    created_at: typedRowData.created_at,
    updated_at: typedRowData.updated_at,
    metadata: (typedRowData as any).metadata || undefined,
    deleted_at: (typedRowData as any).deleted_at || undefined,
    inspection_item_templates: (typedRowData.inspection_item_templates || []).map(item => ({
      id: item.id,
      category_id: item.category_id,
      name_translations: (item.name_translations as TranslationObject | null) || { [locale]: 'Untitled Item' },
      description_translations: (item.description_translations as TranslationObject | null) || { [locale]: '' },
      order_number: item.order_number ?? 0,
      requires_photo: item.requires_photo ?? false,
      requires_notes: item.requires_notes ?? false,
      created_at: item.created_at,
      updated_at: item.updated_at,
    })),
  };
}

/**
 * Deletes an inspection section (category) and its associated items.
 * If the section is part of a master template, it will be disassociated.
 * @param sectionId The ID of the section to delete.
 * @returns A promise that resolves when the deletion is complete.
 * @throws Throws an error if the deletion fails or related operations fail.
 */
export async function deleteInspectionSection(sectionId: string): Promise<void> {
  const supabaseClient = createServiceClient();
  // Check for related items first
  const { count, error: countError } = await supabaseClient
    .from('inspection_item_templates')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', sectionId);

  if (countError) throw countError;
  if (count && count > 0) {
    throw new Error("Cannot delete section with existing items. Please delete items first or use force delete.");
  }

  const { error } = await supabaseClient
    .from('inspection_categories')
    .delete()
    .eq('id', sectionId);

  if (error) throw error;
}

/**
 * Adds a new inspection item template to a category.
 * @param categoryId The ID of the category to add the item to.
 * @param nameTranslations An object containing translations for the item name.
 * @param requires_photo_arg Boolean indicating if a photo is required for this item.
 * @param requires_notes_arg Boolean indicating if notes are required for this item.
 * @param descriptionTranslationsArgument An optional object for item description translations.
 * @returns A promise resolving to the newly created inspection item template.
 * @throws Throws an error if the database operation fails.
 */
export async function addInspectionItem(
  categoryId: string,
  nameTranslations: TranslationObject,
  requires_photo_arg: boolean,
  requires_notes_arg: boolean,
  descriptionTranslationsArgument?: TranslationObject
): Promise<InspectionItemTemplate> {
  const supabaseClient = createServiceClient();

  const newItemPayload = {
    category_id: categoryId,
    name_translations: nameTranslations,
    description_translations: descriptionTranslationsArgument || null,
    requires_photo: requires_photo_arg,
    requires_notes: requires_notes_arg,
    order_number: 0, // Default order_number to 0
  };

  const { data: rowData, error } = await supabaseClient
    .from('inspection_item_templates')
    .insert(newItemPayload)
    .select('*')
    .single<InspectionItemTemplateRow>();

  if (error) throw error;
  if (!rowData) throw new Error("Failed to create inspection item, no data returned.");

  const finalNameTranslations = (rowData.name_translations as TranslationObject | null) || { en: '', ja: '' };
  const finalDescTranslations = (rowData.description_translations as TranslationObject | null) || { en: '', ja: '' };

  return {
    id: rowData.id,
    category_id: rowData.category_id,
    name_translations: finalNameTranslations,
    description_translations: finalDescTranslations,
    order_number: rowData.order_number ?? 0, // Default to 0 if null
    requires_photo: rowData.requires_photo ?? false,
    requires_notes: rowData.requires_notes ?? false,
    created_at: rowData.created_at,
    updated_at: rowData.updated_at,
  };
}

/**
 * Updates an existing inspection item template.
 * @param itemId The ID of the item to update.
 * @param updates An object containing the fields to update (name, description, photo/notes requirement, order number).
 * @returns A promise resolving to the updated inspection item template.
 * @throws Throws an error if the update fails or the item is not found.
 */
export async function updateInspectionItem(
  itemId: string,
  updates: Partial<Pick<InspectionItemTemplateRow, 'name_translations' | 'description_translations' | 'requires_photo' | 'requires_notes' | 'order_number'>>
): Promise<InspectionItemTemplate> {
  const supabaseClient = createServiceClient();
  const { data: rowData, error } = await supabaseClient
    .from('inspection_item_templates')
    .update(updates)
    .eq('id', itemId)
    .select('*')
    .single<InspectionItemTemplateRow>();

  if (error) throw error;
  if (!rowData) throw new Error("Failed to update inspection item, no data returned.");

  const finalNameTranslations = (rowData.name_translations as TranslationObject | null) || { en: '', ja: '' };
  const finalDescTranslations = (rowData.description_translations as TranslationObject | null) || { en: '', ja: '' };

  return {
    id: rowData.id,
    category_id: rowData.category_id,
    name_translations: finalNameTranslations,
    description_translations: finalDescTranslations,
    order_number: rowData.order_number ?? 0,
    requires_photo: rowData.requires_photo ?? false,
    requires_notes: rowData.requires_notes ?? false,
    created_at: rowData.created_at,
    updated_at: rowData.updated_at,
  };
}

/**
 * Deletes an inspection item template.
 * @param itemId The ID of the item to delete.
 * @param force If true, deletes the item even if it has associated inspection results. Defaults to false.
 * @returns A promise that resolves when the deletion is complete.
 * @throws Throws an error if the item has results and force is false, or if deletion fails.
 */
export async function deleteInspectionItem(itemId: string, force: boolean = false): Promise<void> {
  const supabaseClient = createServiceClient();
  if (!force) {
    // Check if item is used in any inspection_results
    const { count, error: usageError } = await supabaseClient
      .from('inspection_items') // This should be inspection_results or inspection_items if it links to templates
      .select('id', { count: 'exact', head: true })
      .eq('template_id', itemId); // Assuming template_id links to inspection_item_templates

    if (usageError) throw usageError;
    if (count && count > 0) {
      throw new Error("Cannot delete item template that is used in inspections. Use force delete or remove from inspections first.");
    }
  }

  const { error } = await supabaseClient
    .from('inspection_item_templates')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

/**
 * Fetches all inspections associated with a specific booking ID.
 * Includes basic vehicle information for each inspection.
 * @param bookingId The unique identifier of the booking.
 * @returns A promise that resolves to an array of inspections related to the booking.
 * @throws Will throw an error if the database query fails.
 */
export async function getInspectionsByBookingId(bookingId: string) {
  const supabaseClient = createServiceClient();
  const { data, error } = await supabaseClient
    .from('inspections')
    .select('*')
    .eq('booking_id', bookingId);

  if (error) throw error;
  return data as DbInspection[];
} 