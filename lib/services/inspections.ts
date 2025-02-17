import { getSupabaseClient } from "@/lib/db/client"
import type { Database } from '@/types/supabase'
import type { InspectionInsert } from "@/types"

type Inspection = Database['public']['Tables']['inspections']['Row']
type InspectionUpdate = Database['public']['Tables']['inspections']['Update']

export async function getInspections(page = 1, status = 'all', search = '') {
  const itemsPerPage = 10
  let query = getSupabaseClient()
    .from('inspections')
    .select(`
      *,
      vehicle:vehicles (
        id,
        name,
        plate_number
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
  return { inspections: data, count }
}

export async function getInspectionById(id: string) {
  const { data, error } = await getSupabaseClient()
    .from('inspections')
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

export async function createInspection(data: InspectionInsert) {
  const supabase = getSupabaseClient()
  
  try {
    // First create the inspection
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .insert({
        vehicle_id: data.vehicle_id,
        inspector_id: data.inspector_id,
        date: data.date,
        status: 'scheduled',
        type: data.type
      })
      .select('*')
      .single()

    if (inspectionError) {
      console.error('Inspection creation error:', inspectionError)
      throw inspectionError
    }

    // Return early if no items to create
    if (!data.items?.length) {
      return inspection
    }

    // Create default inspection items
    const itemsToCreate = data.items.map(item => ({
      inspection_id: inspection.id,
      category: item.category,
      item: item.item_id,
      status: 'pending',
      order_number: 1
    }))

    const { error: itemsError } = await supabase
      .from('inspection_items')
      .insert(itemsToCreate)

    if (itemsError) {
      console.error('Items creation error:', itemsError)
      // Don't throw here, just log the error
      // This way the inspection is still created even if items fail
    }
    
    return inspection
  } catch (error) {
    console.error('Create inspection error:', error)
    throw error
  }
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