import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .is('deleted_at', null)
      .order('first_name')

    if (error) {
      console.error('Error fetching drivers:', error)
      return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 })
    }

    // Format driver names
    const inspectors = drivers?.map(driver => ({
      id: driver.id,
      name: `${driver.first_name} ${driver.last_name}`
    })) || []
    
    return NextResponse.json(inspectors)
  } catch (error) {
    console.error('Error in drivers inspectors API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
