import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { mapSupabaseBookingToBooking } from '@/lib/api/bookings-service'

export const dynamic = 'force-dynamic'

/**
 * GET handler for debugging booking data
 * Returns both the raw database booking record and the mapped booking object
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the booking ID from the URL
    const id = params.id
    
    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }
    
    // Create Supabase client
    const supabase = createServiceClient()
    
    // Fetch the raw booking from the database
    let rawBooking = null
    
    // First try to find by internal UUID
    let { data: uuidBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    // If not found, try to find by WordPress ID
    if (!uuidBooking) {
      const { data: wpBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('wp_id', id)
        .maybeSingle()
      
      rawBooking = wpBooking
    } else {
      rawBooking = uuidBooking
    }
    
    if (!rawBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }
    
    // Map the raw booking to a Booking object
    const mappedBooking = mapSupabaseBookingToBooking(rawBooking)
    
    // Return both the raw and mapped data for debugging
    return NextResponse.json({
      raw: rawBooking,
      mapped: mappedBooking,
      keys: {
        raw: Object.keys(rawBooking),
        mapped: Object.keys(mappedBooking)
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error in booking debug API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 