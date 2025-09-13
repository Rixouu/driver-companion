import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Load groups
    const { data: groupsData, error: groupsError } = await supabase
      .from('user_groups')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (groupsError) throw groupsError

    return NextResponse.json(groupsData || [])

  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
