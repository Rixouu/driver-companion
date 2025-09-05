import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import type { Driver } from '@/types/drivers'

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Starting drivers fetch...')
    
    const supabase = createServiceClient()
    
    // Get current user from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('[API] Fetching drivers for user:', user.id)
    
    // Fetch ALL drivers (not filtered by user_id for booking assignment)
    const { data: drivers, error: fetchError } = await supabase
      .from('drivers')
      .select('*')
      .order('first_name', { ascending: true })

    if (fetchError) {
      console.error('Error fetching drivers:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    console.log('[API] Successfully fetched', drivers?.length || 0, 'drivers')
    
    // Transform data to include full_name
    const transformedDrivers = drivers?.map((driver: any) => ({
      ...driver,
      full_name: `${driver.first_name} ${driver.last_name}`
    })) || []

    return NextResponse.json(transformedDrivers)
  } catch (error) {
    console.error('Error in drivers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
