import { getSupabaseClient } from "@/lib/db/client"
import type { Database } from '@/types/supabase'
import type { InspectionInsert } from "@/types"
import type { InspectionWithVehicle as ImportedInspection, InspectionFormData } from "@/types"
import type { DbInspection, DbVehicle } from "@/types"
import type { InspectionType, InspectionCategory as BaseInspectionCategory, InspectionItemTemplate as BaseInspectionItemTemplate } from '@/types/inspections'

// Use the client from getSupabaseClient consistently throughout the file
const supabase = getSupabaseClient()

type Inspection = Database['public']['Tables']['inspections']['Row']
type InspectionUpdate = Database['public']['Tables']['inspections']['Update']

// Add types for the new translation structure
type TranslationObject = { [key: string]: string }
// Define Row types based on the *expected* DB structure after migrations
// These might differ from the auto-generated Database['public']['Tables'] types until they are updated
type InspectionCategoryRow = {
    id: string;
    type: InspectionType;
    order_number: number;
    created_at: string;
    updated_at: string;
    name_translations: TranslationObject;
    description_translations: TranslationObject | null;
    inspection_item_templates?: InspectionItemTemplateRow[]; // Optional relation
}
type InspectionItemTemplateRow = {
    id: string;
    category_id: string;
    order_number: number;
    requires_photo: boolean;
    requires_notes: boolean;
    created_at: string;
    updated_at: string;
    name_translations: TranslationObject;
    description_translations: TranslationObject | null;
}

// Define the expected return types including translations, extending base types if possible
// These are what the service functions should return
interface InspectionCategory extends BaseInspectionCategory {
    name_translations: TranslationObject;
    description_translations: TranslationObject; // Ensure non-null in return type via defaults
    inspection_item_templates: InspectionItemTemplate[];
}

interface InspectionItemTemplate extends BaseInspectionItemTemplate {
    name_translations: TranslationObject;
    description_translations: TranslationObject; // Ensure non-null in return type via defaults
}

export async function getInspections(options?: {
  page?: number;
  status?: string;
  search?: string;
}) {
  const { page = 1, status = 'all', search = '' } = options || {}
  const itemsPerPage = 10
  
  let query = supabase
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

export async function getInspectionById(id: string) {
  const { data, error } = await supabase
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
    .single()

  if (error) throw error
  return data as unknown as DbInspection
}

export async function createInspection(inspection: Omit<DbInspection, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('inspections')
    .insert(inspection)
    .select()
    .single()

  if (error) throw error
  return data as unknown as DbInspection
}

export async function updateInspectionStatus(id: string, status: Inspection['status']) {
  const { data, error } = await getSupabaseClient()
    .from('inspections')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
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

export async function saveInspectionResults(inspectionId: string, results: InspectionResult[]) {
  const supabase = getSupabaseClient()
  
  try {
    console.log('Saving results:', { inspectionId, results })

    // First update the inspection status
    const { error: statusError } = await supabase
      .from('inspections')
      .update({ status: 'completed' })
      .eq('id', inspectionId)

    if (statusError) {
      console.error('Status update error:', statusError)
      throw statusError
    }

    // Ensure all results have a valid status
    const validResults = results.filter(result => result.status === 'pass' || result.status === 'fail')

    // Save all results at once
    const { data: savedResults, error: resultsError } = await supabase
      .from('inspection_results' as any)
      .insert(validResults.map(result => ({
        inspection_id: inspectionId,
        item_id: result.item_id,
        status: result.status,
        notes: result.notes || ''
      })))
      .select('id, item_id')

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
      const { error: photosError } = await supabase
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

export async function getAllInspections() {
  const { data, error } = await supabase
    .from('inspections')
    .select(`
      *,
      vehicle:vehicles (
        id,
        name,
        plate_number
      )
    `)
    .order('date', { ascending: true })

  if (error) throw error
  return data
}

export async function getInspection(id: string) {
  const { data, error } = await supabase
    .from('inspections')
    .select(`
      *,
      vehicle:vehicles (
        id,
        name,
        plate_number
      ),
      inspection_items!inner (
        id,
        inspection_id,
        template_id,
        status,
        notes
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  // Fetch photos separately since there's no direct relationship
  if (data?.inspection_items) {
    const itemIds = data.inspection_items.map((item: any) => item.id)
    const { data: photos, error: photosError } = await supabase
      .from('inspection_photos')
      .select('*')
      .in('inspection_item_id', itemIds)

    if (photosError) throw photosError

    // Attach photos to their respective items
    data.inspection_items = data.inspection_items.map((item: any) => ({
      ...item,
      inspection_photos: photos.filter(photo => photo.inspection_item_id === item.id)
    }))
  }

  return data
}

export async function updateInspection(id: string, inspection: Partial<InspectionFormData>) {
  const { data, error } = await supabase
    .from('inspections')
    .update(inspection)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Fetch templates with translation columns
export async function getInspectionTemplates(type: InspectionType): Promise<InspectionCategory[]> {
  const { data: categoriesData, error } = await supabase
    .from('inspection_categories') // Use correct table name
    .select(`
      id,
      type,
      order_number,
      created_at,
      updated_at,
      name_translations,        
      description_translations, 
      inspection_item_templates (
        id,
        category_id,
        order_number,
        requires_photo,
        requires_notes,
        created_at,
        updated_at,
        name_translations,        
        description_translations  
      )
    `)
    .eq('type', type)
    .order('order_number')
    .order('order_number', { referencedTable: 'inspection_item_templates', ascending: true }); // Order items within categories

  if (error) {
    console.error("Error fetching inspection templates:", error);
    throw error;
  }

  // Cast the fetched data to our expected Row structure
  const categories = categoriesData as unknown as InspectionCategoryRow[];

  // Map to the final return type, providing defaults for translations and items
  return categories.map((category): InspectionCategory => {
    // Ensure translation objects exist and have default structure
    const nameTrans = category.name_translations || { en: '', ja: '' };
    const descTrans = category.description_translations || { en: '', ja: '' };

    return {
      ...(category as unknown as BaseInspectionCategory), // Cast to base type first
      name_translations: nameTrans, 
      description_translations: descTrans, 
      inspection_item_templates: (category.inspection_item_templates || []).map((item): InspectionItemTemplate => {
        // Ensure item translation objects exist
        const itemNameTrans = item.name_translations || { en: '', ja: '' };
        const itemDescTrans = item.description_translations || { en: '', ja: '' };

        return {
          ...(item as unknown as BaseInspectionItemTemplate), // Cast item to base type
          name_translations: itemNameTrans, 
          description_translations: itemDescTrans, 
        };
      }),
    }
  });
}

export async function saveInspectionPhoto(inspectionItemId: string, photoUrl: string) {
  const { data, error } = await supabase
    .from('inspection_photos')
    .insert({
      inspection_item_id: inspectionItemId,
      photo_url: photoUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Adds a new inspection category (section) with translations.
 * @param type The type of inspection ('routine', 'safety', 'maintenance').
 * @param nameTranslations An object containing name translations (e.g., { en: "Name", ja: "名前" }).
 * @param descriptionTranslations Optional object for description translations.
 * @returns The newly created inspection category with translations.
 */
export async function addInspectionSection(
  type: InspectionType,
  nameTranslations: TranslationObject,
  descriptionTranslations?: TranslationObject
): Promise<InspectionCategory> {
  // 1. Find the next order_number for this type
  const { data: existingSections, error: orderError } = await supabase
    .from('inspection_categories') // Use correct table name
    .select('order_number')
    .eq('type', type)
    .order('order_number', { ascending: false })
    .limit(1)

  if (orderError) {
    console.error("Error fetching max order number for section:", orderError)
    throw new Error("Could not determine order for new section.")
  }

  const nextOrderNumber = (existingSections?.[0]?.order_number ?? -1) + 1

  // 2. Insert the new section with translations
  const insertData: Omit<InspectionCategoryRow, 'id' | 'created_at' | 'updated_at' | 'inspection_item_templates'> = {
      type,
      name_translations: nameTranslations,
      description_translations: descriptionTranslations || null, // Store null if undefined
      order_number: nextOrderNumber,
  }

  const { data: insertedData, error } = await supabase
    .from('inspection_categories') // Use correct table name
    .insert(insertData as any)
    .select(`
      id, type, order_number, created_at, updated_at, name_translations, description_translations
    `) // Select only category fields, items will be empty
    .single()

  if (error) {
    console.error("Error adding inspection section:", error)
    throw error
  }
    if (!insertedData) throw new Error("Failed to insert section or retrieve data.")

  // Return the newly created section, ensuring types and defaults
   const newSection = insertedData as unknown as InspectionCategoryRow;
  return {
    ...(newSection as unknown as BaseInspectionCategory), // Cast to base type
    name_translations: newSection.name_translations || { en: '', ja: '' },
    description_translations: newSection.description_translations || { en: '', ja: '' },
    inspection_item_templates: [] // Initialize as empty array
  } as InspectionCategory // Final cast to ensure conformity
}

/**
 * Updates an existing inspection category (section) with new translations.
 * @param sectionId The ID of the section to update.
 * @param nameTranslations The updated name translations.
 * @param descriptionTranslations The updated description translations (optional).
 * @returns The updated inspection category.
 */
export async function updateInspectionSection(
  sectionId: string,
  nameTranslations: TranslationObject,
  descriptionTranslations?: TranslationObject
): Promise<InspectionCategory> {
  // Prepare update payload, excluding potentially undefined description
  const updatePayload: Partial<Pick<InspectionCategoryRow, 'name_translations' | 'description_translations' | 'updated_at'>> & { updated_at: string } = {
      name_translations: nameTranslations,
      updated_at: new Date().toISOString(),
  };
  if (descriptionTranslations !== undefined) {
      updatePayload.description_translations = descriptionTranslations || null; // Handle empty string vs undefined
  }

  const { data: updatedData, error } = await supabase
    .from('inspection_categories') // Use correct table name
    .update(updatePayload)
    .eq('id', sectionId)
    .select(`
      id, type, order_number, created_at, updated_at, name_translations, description_translations,
      inspection_item_templates (
         id, category_id, order_number, requires_photo, requires_notes, created_at, updated_at, name_translations, description_translations
      )
    `) // Fetch updated data with items
    .single()

  if (error) {
    console.error("Error updating inspection section:", error)
    throw error
  }
  if (!updatedData) throw new Error("Section not found after update.")

   // Re-fetch items separately to ensure order? Or rely on the initial fetch? Let's assume the above select works for now.
   // If ordering becomes an issue, fetch items separately and sort.
   const updatedSection = updatedData as unknown as InspectionCategoryRow;

  return {
     ...(updatedSection as unknown as BaseInspectionCategory), // Cast to base
     name_translations: updatedSection.name_translations || { en: '', ja: '' },
     description_translations: updatedSection.description_translations || { en: '', ja: '' },
     inspection_item_templates: (updatedSection.inspection_item_templates || []).map((item: InspectionItemTemplateRow): InspectionItemTemplate => ({ // Add explicit type for item
        ...(item as unknown as BaseInspectionItemTemplate), // Cast item to base
        name_translations: item.name_translations || { en: '', ja: '' },
        description_translations: item.description_translations || { en: '', ja: '' },
     }))
  } as InspectionCategory // Final cast
}

/**
 * Deletes an inspection category (section) and its associated items.
 * @param sectionId The ID of the section to delete.
 */
export async function deleteInspectionSection(sectionId: string): Promise<void> {
  // Get all item templates in this section
  const { data: sectionItems, error: itemsError } = await supabase
    .from('inspection_item_templates')
    .select('id')
    .eq('category_id', sectionId)

  if (itemsError) {
    console.error("Error retrieving items in section:", itemsError)
    throw new Error(`Failed to retrieve items for section ${sectionId}: ${itemsError.message}`)
  }

  // If there are items, check if any are used in inspections
  if (sectionItems && sectionItems.length > 0) {
    const itemIds = sectionItems.map(item => item.id)
    
    const { data: usedItems, error: usedItemsError } = await supabase
      .from('inspection_items')
      .select('template_id')
      .in('template_id', itemIds)
    
    if (usedItemsError) {
      console.error("Error checking used items:", usedItemsError)
      throw new Error(`Failed to check if section items are in use: ${usedItemsError.message}`)
    }
    
    if (usedItems && usedItems.length > 0) {
      throw new Error(`Cannot delete section because ${usedItems.length} of its items are used in inspections. Please delete those inspection records first or contact an administrator.`)
    }
  }

  // First explicitly delete all items in this section to ensure proper cascading
  const { error: itemDeleteError } = await supabase
    .from('inspection_item_templates')
    .delete()
    .eq('category_id', sectionId)

  if (itemDeleteError) {
    console.error("Error deleting items in section:", itemDeleteError)
    throw new Error(`Failed to delete items for section ${sectionId}: ${itemDeleteError.message}`)
  }

  // Then delete the section itself
  const { error } = await supabase
    .from('inspection_categories')
    .delete()
    .eq('id', sectionId)

  if (error) {
    console.error("Error deleting inspection section:", error)
    throw new Error(`Failed to delete section ${sectionId}: ${error.message}`)
  }
}

/**
 * Adds a new inspection item template to a category with translations.
 * @param categoryId The ID of the category to add the item to.
 * @param nameTranslations An object containing name translations.
 * @param requires_photo Whether the item requires a photo.
 * @param requires_notes Whether the item requires notes.
 * @param descriptionTranslations Optional object for description translations.
 * @returns The newly created inspection item template.
 */
export async function addInspectionItem(
  categoryId: string,
  nameTranslations: TranslationObject,
  requires_photo: boolean,
  requires_notes: boolean,
  descriptionTranslations?: TranslationObject
): Promise<InspectionItemTemplate> {
  // 1. Find the next order_number for this category
  const { data: existingItems, error: orderError } = await supabase
    .from('inspection_item_templates') // Use correct table name
    .select('order_number')
    .eq('category_id', categoryId)
    .order('order_number', { ascending: false })
    .limit(1)

  if (orderError) {
    console.error("Error fetching max order number for item:", orderError)
    throw new Error("Could not determine order for new item.")
  }

  const nextOrderNumber = (existingItems?.[0]?.order_number ?? -1) + 1

  // 2. Insert the new item
  const insertData: Omit<InspectionItemTemplateRow, 'id' | 'created_at' | 'updated_at'> = {
      category_id: categoryId,
      name_translations: nameTranslations,
      description_translations: descriptionTranslations || null,
      requires_photo,
      requires_notes,
      order_number: nextOrderNumber,
  }

  const { data: insertedData, error } = await supabase
    .from('inspection_item_templates') // Use correct table name
    .insert(insertData as any)
    .select()
    .single()

  if (error) {
    console.error("Error adding inspection item:", error)
    throw error
  }
    if (!insertedData) throw new Error("Failed to insert item or retrieve data.")

  // Return the newly created item with default translations if needed
    const newItem = insertedData as unknown as InspectionItemTemplateRow;
  return {
     ...(newItem as unknown as BaseInspectionItemTemplate), // Cast to base
     name_translations: newItem.name_translations || { en: '', ja: '' },
     description_translations: newItem.description_translations || { en: '', ja: '' },
  } as InspectionItemTemplate // Final cast
}

/**
 * Updates an existing inspection item template.
 * @param itemId The ID of the item to update.
 * @param updates An object containing the fields to update (name_translations, description_translations, requires_photo, requires_notes).
 * @returns The updated inspection item template.
 */
export async function updateInspectionItem(
  itemId: string,
  updates: Partial<Pick<InspectionItemTemplateRow, 'name_translations' | 'description_translations' | 'requires_photo' | 'requires_notes'>>
): Promise<InspectionItemTemplate> {

  // Ensure translations are structured correctly, providing defaults if necessary
    // Prepare update payload, handling potential undefined/null description
    const updateData: Partial<Pick<InspectionItemTemplateRow, 'name_translations' | 'description_translations' | 'requires_photo' | 'requires_notes' | 'updated_at'>> & { updated_at: string } = {
        updated_at: new Date().toISOString(),
    };
    if (updates.name_translations !== undefined) {
        updateData.name_translations = updates.name_translations || { en: '', ja: '' }; // Ensure object
    }
    if (updates.description_translations !== undefined) {
        updateData.description_translations = updates.description_translations || null; // Allow null
    }
    if (updates.requires_photo !== undefined) {
        updateData.requires_photo = updates.requires_photo;
    }
    if (updates.requires_notes !== undefined) {
        updateData.requires_notes = updates.requires_notes;
    }


  const { data: updatedData, error } = await supabase
    .from('inspection_item_templates') // Use correct table name
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single()

  if (error) {
    console.error("Error updating inspection item:", error)
    throw error
  }
   if (!updatedData) throw new Error("Item not found after update.")

    const updatedItem = updatedData as unknown as InspectionItemTemplateRow;
  return {
      ...(updatedItem as unknown as BaseInspectionItemTemplate), // Cast to base
      name_translations: updatedItem.name_translations || { en: '', ja: '' },
      description_translations: updatedItem.description_translations || { en: '', ja: '' },
  } as InspectionItemTemplate // Final cast
}

/**
 * Deletes an inspection item template.
 * @param itemId The ID of the item to delete.
 * @param force If true, will also delete any inspection items that depend on this template.
 */
export async function deleteInspectionItem(itemId: string, force: boolean = false): Promise<void> {
  // First check if the item has any associated inspection_items
  const { data: dependentItems, error: checkDependentsError } = await supabase
    .from('inspection_items')
    .select('id')
    .eq('template_id', itemId)

  if (checkDependentsError) {
    console.error("Error checking dependent items:", checkDependentsError)
    throw new Error(`Unable to check for dependent items: ${checkDependentsError.message}`)
  }

  // If there are dependent inspection items, handle based on force parameter
  if (dependentItems && dependentItems.length > 0) {
    if (force) {
      // Delete all dependent inspection items
      const { error: deleteItemsError } = await supabase
        .from('inspection_items')
        .delete()
        .eq('template_id', itemId)
      
      if (deleteItemsError) {
        console.error("Error deleting dependent inspection items:", deleteItemsError)
        throw new Error(`Failed to delete dependent items: ${deleteItemsError.message}`)
      }
    } else {
      throw new Error(`Cannot delete template item that is used in ${dependentItems.length} inspections. Please delete those inspection records first or contact an administrator.`)
    }
  }

  // Then check if the item exists to provide better error messages
  const { data: existingItem, error: checkError } = await supabase
    .from('inspection_item_templates')
    .select('id')
    .eq('id', itemId)
    .single()

  if (checkError) {
    console.error("Error checking inspection item existence:", checkError)
    throw new Error(`Item ${itemId} not found or cannot be accessed: ${checkError.message}`)
  }

  if (!existingItem) {
    throw new Error(`Item ${itemId} not found`)
  }

  // Then delete the item
  const { error } = await supabase
    .from('inspection_item_templates')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error("Error deleting inspection item:", error)
    throw new Error(`Failed to delete item ${itemId}: ${error.message}`)
  }
}

/**
 * Get inspections associated with a specific booking
 * @param bookingId - The ID of the booking
 * @returns An array of inspections
 */
export async function getInspectionsByBookingId(bookingId: string) {
  const { data, error } = await supabase
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
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as unknown as DbInspection[]
} 