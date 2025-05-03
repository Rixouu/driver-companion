import { NextResponse } from 'next/server'
import { getBookingByIdFromDatabase } from '@/lib/api/bookings-service'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the booking ID from the URL
    const id = params.id
    
    console.log(`[API] Fetching booking with ID: ${id}`)
    
    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }
    
    // Fetch the booking from the database
    const { booking, error } = await getBookingByIdFromDatabase(id)
    
    // Log the raw booking data for debugging
    console.log(`[API] Booking data for ID ${id}:`, booking ? 'FOUND' : 'NOT FOUND')
    
    // Check specific fields we're interested in
    if (booking) {
      console.log(`[API] Billing fields for ${id}:`, {
        billing_company_name: booking.billing_company_name,
        billing_tax_number: booking.billing_tax_number,
        billing_street_name: booking.billing_street_name,
        billing_street_number: booking.billing_street_number,
        billing_city: booking.billing_city,
        billing_state: booking.billing_state,
        billing_postal_code: booking.billing_postal_code,
        billing_country: booking.billing_country
      })
      
      console.log(`[API] Coupon fields for ${id}:`, {
        coupon_code: booking.coupon_code,
        coupon_discount_percentage: booking.coupon_discount_percentage  
      })
    }
    
    if (error || !booking) {
      console.log(`[API] Error fetching booking ${id}:`, error)
      return NextResponse.json(
        { error: error || 'Booking not found' },
        { status: 404 }
      )
    }
    
    // Return the booking data with no-cache headers
    return NextResponse.json(booking, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('[API] Error in booking API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 