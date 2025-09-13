import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { sendTripReminderEmail } from '@/lib/email/trip-reminder-email'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TRIP-REMINDER-TEST] Starting trip reminder email test...')
    
    const { bookingId, reminderType = '24h' } = await request.json()
    console.log('📝 [TRIP-REMINDER-TEST] Request data:', { bookingId, reminderType })

    if (!bookingId) {
      console.error('❌ [TRIP-REMINDER-TEST] Missing booking ID')
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    if (!['24h', '2h'].includes(reminderType)) {
      console.error('❌ [TRIP-REMINDER-TEST] Invalid reminder type')
      return NextResponse.json(
        { error: 'Reminder type must be "24h" or "2h"' },
        { status: 400 }
      )
    }

    // Create Supabase client
    console.log('🔌 [TRIP-REMINDER-TEST] Creating Supabase client...')
    const supabase = createServiceClient()
    console.log('✅ [TRIP-REMINDER-TEST] Supabase client created successfully')

    // Fetch booking details with all related data
    console.log('🔍 [TRIP-REMINDER-TEST] Fetching booking data for ID:', bookingId)
    
    // Check if this looks like a WordPress ID (starts with letters and contains hyphens)
    const isWordPressId = /^[A-Z]+-\d+(-\d+)?$/.test(bookingId)
    const searchField = isWordPressId ? 'wp_id' : 'id'
    
    console.log(`🔍 [TRIP-REMINDER-TEST] ID format detected: ${isWordPressId ? 'WordPress ID' : 'UUID'}`)
    console.log(`🔍 [TRIP-REMINDER-TEST] Searching by field: ${searchField}`)
    
    let { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        drivers:driver_id (
          first_name,
          last_name,
          phone,
          email
        ),
        vehicles:vehicle_id (
          plate_number,
          brand,
          model
        ),
        customers:customer_id (
          email,
          name
        )
      `)
      .eq(searchField, bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('❌ [TRIP-REMINDER-TEST] Booking not found:', bookingError)
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    console.log('✅ [TRIP-REMINDER-TEST] Booking found:', {
      wp_id: booking.wp_id,
      service_name: booking.service_name,
      date: booking.date,
      time: booking.time
    })

    // Get booking creator (admin who created the booking)
    const { data: creator } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', booking.created_by)
      .single()

    if (!booking.customers?.email) {
      console.error('❌ [TRIP-REMINDER-TEST] No customer email found')
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      )
    }

    if (!booking.drivers?.email) {
      console.error('❌ [TRIP-REMINDER-TEST] No driver email found')
      return NextResponse.json(
        { error: 'Driver email not found' },
        { status: 400 }
      )
    }

    if (!creator?.email) {
      console.error('❌ [TRIP-REMINDER-TEST] No creator email found')
      return NextResponse.json(
        { error: 'Creator email not found' },
        { status: 400 }
      )
    }

    console.log('📧 [TRIP-REMINDER-TEST] Email addresses found:', {
      customer: booking.customers.email,
      driver: booking.drivers.email,
      creator: creator.email
    })

    // Prepare email data
    const emailData = {
      booking: {
        id: booking.id,
        wp_id: booking.wp_id,
        service_name: booking.service_name,
        date: booking.date,
        time: booking.time,
        pickup_location: booking.pickup_location,
        dropoff_location: booking.dropoff_location,
        notes: booking.notes,
        drivers: booking.drivers,
        vehicles: booking.vehicles
      },
      customer: {
        email: booking.customers.email,
        name: booking.customers.name || 'Customer'
      },
      creator: {
        email: creator.email,
        name: creator.full_name || 'Admin'
      },
      driver: {
        email: booking.drivers.email,
        name: `${booking.drivers.first_name || ''} ${booking.drivers.last_name || ''}`.trim() || 'Driver'
      },
      reminderType: reminderType as '24h' | '2h'
    }

    // Send trip reminder email
    console.log('📤 [TRIP-REMINDER-TEST] Sending trip reminder email...')
    const result = await sendTripReminderEmail(emailData)
    
    console.log('✅ [TRIP-REMINDER-TEST] Trip reminder email sent successfully:', result)

    return NextResponse.json({
      success: true,
      message: 'Trip reminder email sent successfully',
      data: {
        bookingId: booking.wp_id,
        reminderType,
        recipients: result.recipients,
        customerEmail: booking.customers.email,
        driverEmail: booking.drivers.email,
        creatorEmail: creator.email
      }
    })

  } catch (error) {
    console.error('❌ [TRIP-REMINDER-TEST] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send trip reminder email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
