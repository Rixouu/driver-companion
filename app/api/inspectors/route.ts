import { getSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get all inspector_ids from inspections table
    const { data: inspectionInspectorIds, error: inspectionError } = await supabase
      .from('inspections')
      .select('inspector_id')
      .not('inspector_id', 'is', null)

    if (inspectionError) {
      console.error('Error fetching inspection inspector IDs:', inspectionError)
      return NextResponse.json({ error: 'Failed to fetch inspection data' }, { status: 500 })
    }

    // Extract unique inspector IDs
    const uniqueInspectorIds = [...new Set(
      inspectionInspectorIds
        ?.map(i => i.inspector_id)
        .filter((id): id is string => id !== null) || []
    )]

    if (uniqueInspectorIds.length === 0) {
      return NextResponse.json([])
    }

    // Get all profiles who are assigned as inspectors
    const { data: inspectors, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', uniqueInspectorIds)
      .order('full_name')

    if (error) {
      console.error('Error fetching inspectors:', error)
      return NextResponse.json({ error: 'Failed to fetch inspectors' }, { status: 500 })
    }

    // Transform to match the expected format
    const transformedInspectors = inspectors?.map(profile => ({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email
    })) || []

    console.log('🔍 [INSPECTORS_API] Returning inspectors:', {
      rawCount: inspectors?.length || 0,
      transformedCount: transformedInspectors.length,
      sample: transformedInspectors.slice(0, 3),
      inspectorIds: uniqueInspectorIds.slice(0, 5)
    })

    return NextResponse.json(transformedInspectors)
  } catch (error) {
    console.error('Error in inspectors API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
