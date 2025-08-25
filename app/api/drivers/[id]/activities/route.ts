import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

async function createSupabaseServer() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 API: Starting consolidated activities fetch for driver')
    const supabase = await createSupabaseServer()
    const driverId = (await params).id

    console.log('🔍 API: Driver ID:', driverId)

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      )
    }

    // Get driver email
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('email')
      .eq('id', driverId)
      .single()

    if (driverError) {
      console.error('❌ API: Error fetching driver:', driverError)
      return NextResponse.json(
        { error: 'Failed to fetch driver' },
        { status: 500 }
      )
    }

    console.log('🔍 API: Driver email:', driver.email)

    // Fetch all activities in parallel
    const [bookingsResult, inspectionsResult, maintenanceResult] = await Promise.all([
      // Get bookings
      supabase
        .from('bookings')
        .select(`
          id,
          date,
          time,
          status,
          customer_name,
          pickup_location,
          dropoff_location,
          vehicle:vehicles (
            id,
            name,
            model,
            year
          )
        `)
        .eq('driver_id', driverId)
        .order('date', { ascending: false }),

      // Get inspections from the view (if accessible)
      supabase
        .from('inspection_details')
        .select('*')
        .eq('inspector_email', driver.email)
        .order('date', { ascending: false }),

      // Get maintenance tasks
      supabase
        .from('maintenance_tasks')
        .select(`
          id,
          title,
          description,
          due_date,
          completed_date,
          status,
          vehicle:vehicles (
            id,
            name,
            model,
            year
          )
        `)
        .eq('assigned_driver_id', driverId)
        .order('due_date', { ascending: false })
    ])

    // Handle results
    const bookings = bookingsResult.data || []
    const inspections = inspectionsResult.data || []
    const maintenance = maintenanceResult.data || []

    console.log('✅ API: Successfully fetched activities:', {
      bookings: bookings.length,
      inspections: inspections.length,
      maintenance: maintenance.length
    })

    return NextResponse.json({
      bookings,
      inspections,
      maintenance
    })

  } catch (error) {
    console.error('❌ API: Error in driver activities API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
