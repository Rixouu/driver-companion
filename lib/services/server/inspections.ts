import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { InspectionInsert } from "@/types"

export async function createInspection(data: InspectionInsert) {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  try {
    const { data: inspection, error } = await supabase
      .from('inspections')
      .insert({
        vehicle_id: data.vehicle_id,
        inspector_id: data.inspector_id,
        date: data.date,
        status: 'scheduled',
        type: data.type,
        items: data.items || []
      })
      .select('*')
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    
    return inspection
  } catch (error) {
    console.error('Create inspection error:', error)
    throw error
  }
} 