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
    
    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }
    
    // Fetch the booking from the database
    const { booking, error } = await getBookingByIdFromDatabase(id)
    
    if (error || !booking) {
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
    console.error('Error in booking API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 