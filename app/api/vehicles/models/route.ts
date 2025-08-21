import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get all vehicles with models
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('model')
      .not('model', 'is', null)

    if (error) {
      console.error('Error fetching vehicle models:', error)
      return NextResponse.json({ error: 'Failed to fetch vehicle models' }, { status: 500 })
    }

    // Extract unique models and trim whitespace
    const uniqueModels = [...new Set(
      vehicles
        ?.map(v => v.model?.trim()) // Trim whitespace
        .filter(Boolean) // Filter out nulls and empty strings
        || []
    )]

    // Sort alphabetically
    uniqueModels.sort()

    return NextResponse.json(uniqueModels)
  } catch (error) {
    console.error('Error in vehicle models API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
