import { getSupabaseClient } from "@/lib/db/client"
import type { Database } from '@/types/supabase'
import type { InspectionInsert } from "@/types"
import { supabase } from "@/lib/supabase/client"
import type { InspectionWithVehicle as ImportedInspection, InspectionFormData } from "@/types"
import type { DbInspection } from "@/types"

type Inspection = Database['public']['Tables']['inspections']['Row']
type InspectionUpdate = Database['public']['Tables']['inspections']['Update']

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
  return { inspections: data as DbInspection[], count }
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
  return data as DbInspection
}

export async function createInspection(inspection: Omit<DbInspection, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('inspections')
    .insert(inspection)
    .select()
    .single()

  if (error) throw error
  return data as DbInspection
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
      .from('inspection_results')
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
      const savedResult = savedResults.find(r => r.item_id === result.item_id)
      return result.photos?.map(photo => ({
        result_id: savedResult?.id,
        photo_url: photo
      })) || []
    }).filter(photo => photo.result_id)

    if (photosToSave.length > 0) {
      const { error: photosError } = await supabase
        .from('inspection_photos')
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

export async function getInspectionTemplates(type: 'routine' | 'safety' | 'maintenance') {
  const { data: categories, error } = await supabase
    .from('inspection_categories')
    .select(`
      id,
      name,
      description,
      order_number,
      inspection_item_templates (
        id,
        name,
        description,
        requires_photo,
        requires_notes,
        order_number
      )
    `)
    .eq('type', type)
    .order('order_number');

  if (error) throw error;
  return categories;
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