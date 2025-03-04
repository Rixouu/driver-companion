import { supabase } from "@/lib/supabase/client"
import { createServiceClient } from '@/lib/supabase/service-client'
import type { FuelLog } from "@/types"
import type { Database } from '@/types/supabase'

export async function getFuelLogs(vehicleId?: string) {
  try {
    let query = supabase
      .from('fuel_entries')
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

    return { logs: data as FuelLog[] }
  } catch (error) {
    console.error('Error:', error)
    return { logs: [] }
  }
}

export async function getFuelLog(id: string, userId?: string) {
  try {
    // First check if user has access to the fuel log directly
    const { data: fuelLog, error: fuelError } = await supabase
      .from('fuel_entries')
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

    if (fuelError) {
      // If RLS blocks access, try with service client
      const serviceClient = createServiceClient()
      const { data: adminFuelLog, error: adminError } = await serviceClient
        .from('fuel_entries')
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
        console.error('Error fetching fuel log:', adminError)
        return { log: null }
      }

      // If no userId provided, return null
      if (!userId) {
        console.error('No user ID provided')
        return { log: null }
      }

      // Check if user owns either the vehicle or the fuel log
      if (adminFuelLog.user_id !== userId && adminFuelLog.vehicle.user_id !== userId) {
        console.error('User does not have access to this fuel log or vehicle')
        return { log: null }
      }

      return { log: adminFuelLog }
    }

    return { log: fuelLog }
  } catch (error) {
    console.error('Error in getFuelLog:', error)
    return { log: null }
  }
}

export async function createFuelLog(log: Partial<FuelLog>) {
  try {
    const { data, error } = await supabase
      .from('fuel_entries')
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

    return { log: data as FuelLog }
  } catch (error) {
    console.error('Error:', error)
    return { error }
  }
}

export async function updateFuelLog(id: string, log: Partial<FuelLog>) {
  try {
    console.log('Updating fuel log:', { id, log })
    
    const { data, error } = await supabase
      .from('fuel_entries')
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
      .maybeSingle()

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    if (!data) {
      console.error('No data returned after update')
      throw new Error('Failed to update fuel log')
    }

    console.log('Successfully updated fuel log:', data)
    return { log: data as FuelLog }
  } catch (error) {
    console.error('Error in updateFuelLog:', error)
    return { error }
  }
}

export async function deleteFuelLog(id: string) {
  try {
    const { error } = await supabase
      .from('fuel_entries')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error }
  }
} 