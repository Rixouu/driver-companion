'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Driver } from '@/types/drivers'

export async function createDriverAction(driver: Partial<Driver>) {
  const supabase = await getSupabaseServerClient()
  
  try {
    // Get current user ID
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user:', JSON.stringify(userError))
      throw userError
    }
    
    const userId = userData.user?.id
    
    if (!userId) {
      throw new Error('User not authenticated')
    }
    
    // Insert the new driver
    const { data, error } = await supabase
      .from('drivers')
      .insert({
        first_name: driver.first_name || '',
        last_name: driver.last_name || '',
        email: driver.email || '',
        phone: driver.phone || null,
        line_id: driver.line_id || null,
        license_number: driver.license_number || null,
        license_expiry: driver.license_expiry || null,
        address: driver.address || null,
        emergency_contact: driver.emergency_contact || null,
        notes: driver.notes || null,
        user_id: userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating driver:', JSON.stringify(error))
      throw error
    }
    
    if (!data) {
      throw new Error('Failed to retrieve created driver data')
    }
    
    return {
      ...data,
      full_name: `${data.first_name} ${data.last_name}`
    } as Driver
  } catch (error) {
    console.error('Detailed error creating driver:', error)
    throw error
  }
}