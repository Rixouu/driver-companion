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
        ?.map(v => v.model?.trim().toLowerCase()) // Trim whitespace and convert to lowercase
        .filter(Boolean) // Filter out nulls and empty strings
        || []
    )]

    // Convert back to proper case (first letter capitalized) and sort alphabetically
    const formattedModels = uniqueModels
      .map(model => model.charAt(0).toUpperCase() + model.slice(1))
      .sort()

    console.log('🔍 [VEHICLE_MODELS_API] Processing models:', {
      rawCount: vehicles?.length || 0,
      uniqueCount: uniqueModels.length,
      formattedCount: formattedModels.length,
      sample: formattedModels.slice(0, 5)
    })

    return NextResponse.json(formattedModels)
  } catch (error) {
    console.error('Error in vehicle models API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
