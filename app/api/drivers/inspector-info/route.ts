import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { inspector_id } = await request.json()

    if (!inspector_id) {
      return NextResponse.json(
        { error: 'Inspector ID is required' },
        { status: 400 }
      )
    }

    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, email')
      .eq('id', inspector_id)
      .single()

    if (driverError || !driver) {
      return NextResponse.json(
        { error: 'Inspector not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ driver })
  } catch (error) {
    console.error('Error fetching inspector info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
