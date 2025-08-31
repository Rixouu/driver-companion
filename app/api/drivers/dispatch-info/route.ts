import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { booking_id } = await request.json()

    if (!booking_id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Query dispatch_entries table to get driver_id for the booking
    const { data: dispatchEntry, error: dispatchError } = await supabase
      .from('dispatch_entries')
      .select('driver_id')
      .eq('booking_id', booking_id)
      .single()

    if (dispatchError || !dispatchEntry?.driver_id) {
      return NextResponse.json(
        { error: 'No driver assigned to this booking' },
        { status: 404 }
      )
    }

    // Query drivers table to get driver information
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, email')
      .eq('id', dispatchEntry.driver_id)
      .single()

    if (driverError || !driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ driver })
  } catch (error) {
    console.error('Error fetching driver dispatch info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
