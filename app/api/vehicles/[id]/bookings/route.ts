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

    // Fetch vehicle bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        wp_id,
        customer_name,
        customer_email,
        customer_phone,
        service_name,
        date,
        time,
        status,
        pickup_location,
        dropoff_location,
        price_amount,
        price_currency,
        vehicle_id,
        created_at,
        updated_at
      `)
      .eq('vehicle_id', id)
      .order('date', { ascending: false })

    if (bookingsError) {
      console.error('Error fetching vehicle bookings:', bookingsError)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle bookings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      vehicle_id: id,
      bookings: bookings || [],
      total_count: bookings?.length || 0
    })

  } catch (error) {
    console.error('Error in vehicle bookings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 