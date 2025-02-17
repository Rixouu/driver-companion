'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { InspectionInsert } from "@/types"

export async function createInspection(data: InspectionInsert) {
  const supabase = createServerComponentClient<Database>({ cookies })
  
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

    // Then create default inspection items if needed
    if (data.items && data.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('inspection_items')
        .insert(
          data.items.map(item => ({
            inspection_id: inspection.id,
            ...item
          }))
        )

      if (itemsError) {
        console.error('Items creation error:', itemsError)
        throw itemsError
      }
    }
    
    return inspection
  } catch (error) {
    console.error('Create inspection error:', error)
    throw error
  }
} 