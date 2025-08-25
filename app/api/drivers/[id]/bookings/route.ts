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
    console.log('🔍 API: Starting bookings fetch for driver')
    const supabase = await createSupabaseServer()
    const resolvedParams = await params
    const driverId = (await params).id

    console.log('🔍 API: Driver ID:', driverId)

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      )
    }

    // Get bookings for this driver - try multiple approaches
    console.log('🔍 API: Fetching bookings for driver ID:', driverId)
    
    // First, try direct driver_id assignment
    let { data: directBookings, error: directError } = await supabase
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
      .order('date', { ascending: false })

    // Also try to get bookings through vehicle assignments
    let { data: vehicleAssignmentBookings, error: vehicleError } = await supabase
      .from('vehicle_assignments')
      .select(`
        vehicle_id,
        bookings:bookings (
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
        )
      `)
      .eq('driver_id', driverId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Combine both approaches
    let allBookings = directBookings || []
    
    if (vehicleAssignmentBookings) {
      vehicleAssignmentBookings.forEach(assignment => {
        if (assignment.bookings) {
          allBookings = [...allBookings, ...assignment.bookings]
        }
      })
    }

    // Remove duplicates and sort by date
    const uniqueBookings = allBookings.filter((booking, index, self) => 
      index === self.findIndex(b => b.id === booking.id)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (directError && vehicleError) {
      console.error('❌ API: Error fetching bookings:', { directError, vehicleError })
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    console.log('✅ API: Successfully fetched bookings:', uniqueBookings?.length || 0)

    return NextResponse.json({
      bookings: uniqueBookings || []
    })
  } catch (error) {
    console.error('❌ API: Error in driver bookings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
