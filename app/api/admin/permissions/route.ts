import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Load permissions
    const { data: permissionsData, error: permissionsError } = await supabase
      .from('permissions')
      .select('*')
      .order('category, name')

    if (permissionsError) throw permissionsError

    return NextResponse.json(permissionsData || [])

  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
