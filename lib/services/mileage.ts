import { supabase } from "@/lib/supabase/client"
import { createServiceClient } from '@/lib/supabase/service-client'
import type { MileageLog } from "@/types"
import type { Database } from '@/types/supabase'

export async function getMileageLogs(vehicleId?: string) {
  try {
    let query = supabase
      .from('mileage_entries')
      .select(`
        *,
        vehicles (
          id,
          name,
          plate_number
        )
      `)
      .order('date', { ascending: false })

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId)
    }

    const { data, error } = await query

    if (error) throw error

    return { logs: data as MileageLog[] }
  } catch (error) {
    console.error('Error:', error)
    return { logs: [] }
  }
}

export async function getMileageLog(id: string, userId?: string) {
  try {
    // First check if user has access to the mileage log directly
    const { data: mileageLog, error: mileageError } = await supabase
      .from('mileage_entries')
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
          vin,
          user_id
        )
      `)
      .eq('id', id)
      .single()

    if (mileageError) {
      // If RLS blocks access, try with service client
      const serviceClient = createServiceClient()
      const { data: adminMileageLog, error: adminError } = await serviceClient
        .from('mileage_entries')
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
            vin,
            user_id
          )
        `)
        .eq('id', id)
        .single()

      if (adminError) {
        console.error('Error fetching mileage log:', adminError)
        return { log: null }
      }

      // If no userId provided, return null
      if (!userId) {
        console.error('No user ID provided')
        return { log: null }
      }

      // Check if user owns either the vehicle or the mileage log
      if (adminMileageLog.user_id !== userId && adminMileageLog.vehicle.user_id !== userId) {
        console.error('User does not have access to this mileage log or vehicle')
        return { log: null }
      }

      return { log: adminMileageLog }
    }

    return { log: mileageLog }
  } catch (error) {
    console.error('Error in getMileageLog:', error)
    return { log: null }
  }
}

export async function createMileageLog(log: Partial<MileageLog>) {
  try {
    const { data, error } = await supabase
      .from('mileage_entries')
      .insert({
        ...log,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        vehicles (
          id,
          name,
          plate_number
        )
      `)
      .single()

    if (error) throw error

    return { log: data as MileageLog }
  } catch (error) {
    console.error('Error:', error)
    return { error }
  }
}

export async function updateMileageLog(id: string, log: Partial<MileageLog>) {
  try {
    const { data, error } = await supabase
      .from('mileage_entries')
      .update({
        ...log,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        vehicles (
          id,
          name,
          plate_number
        )
      `)
      .single()

    if (error) throw error

    return { log: data as MileageLog }
  } catch (error) {
    console.error('Error:', error)
    return { error }
  }
}

export async function deleteMileageLog(id: string) {
  try {
    const { error } = await supabase
      .from('mileage_entries')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error }
  }
} 