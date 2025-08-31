import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Fetch vehicle inspections
    const { data: inspections, error: inspectionsError } = await supabase
      .from('inspections')
      .select(`
        id,
        type,
        date,
        status,
        notes,
        vehicle_id,
        inspector_id,
        created_at,
        updated_at
      `)
      .eq('vehicle_id', id)
      .order('date', { ascending: false })

    if (inspectionsError) {
      console.error('Error fetching vehicle inspections:', inspectionsError)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle inspections' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      vehicle_id: id,
      inspections: inspections || [],
      total_count: inspections?.length || 0
    })

  } catch (error) {
    console.error('Error in vehicle inspections API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 