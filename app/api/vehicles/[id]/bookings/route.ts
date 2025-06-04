import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServer()
    const resolvedParams = await params
    const vehicleId = resolvedParams.id

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Fetch bookings for the vehicle
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        wp_id,
        customer_name,
        customer_email,
        date,
        time,
        pickup_location,
        dropoff_location,
        status,
        service_name,
        created_at
      `)
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vehicle bookings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedBookings = (bookings || []).map((booking: any) => ({
      id: booking.id,
      booking_id: booking.wp_id,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      pickup_date: booking.date,
      pickup_time: booking.time,
      pickup_location: booking.pickup_location,
      dropoff_location: booking.dropoff_location,
      status: booking.status,
      service_name: booking.service_name,
      created_at: booking.created_at
    }))

    return NextResponse.json(transformedBookings)
  } catch (error) {
    console.error('Error in vehicle bookings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 