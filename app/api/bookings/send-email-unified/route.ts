import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { EmailAPIWrapper } from '@/lib/services/email-api-wrapper'

// =============================================================================
// UNIFIED BOOKING EMAIL API - Clean & Fast
// =============================================================================

export async function POST(request: NextRequest) {
  console.log('🔄 [UNIFIED-BOOKING-EMAIL-API] Starting booking email process')
  
  try {
    const body = await request.json()
    const {
      booking_id,
      email_type = 'confirmation', // 'confirmation', 'reminder', 'cancelled', 'completed'
      language = 'en',
      bcc_emails = 'booking@japandriver.com',
      payment_data
    } = body

    if (!booking_id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    console.log(`🔄 [UNIFIED-BOOKING-EMAIL-API] Processing booking ${booking_id} - ${email_type}`)

    // Get booking data
    const supabase = createServiceClient()
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      console.error('❌ [UNIFIED-BOOKING-EMAIL-API] Booking not found:', bookingError)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    console.log(`✅ [UNIFIED-BOOKING-EMAIL-API] Booking data prepared: ${booking_id}`)

    // Send email based on type
    let result
    switch (email_type) {
      case 'confirmation':
        result = await EmailAPIWrapper.sendBookingConfirmation({
          booking: booking as any,
          paymentData: payment_data,
          language: language as 'en' | 'ja',
          bccEmails: bcc_emails
        })
        break

      case 'reminder':
        result = await EmailAPIWrapper.sendBookingReminder(
          booking as any,
          language as 'en' | 'ja',
          bcc_emails
        )
        break

      case 'payment':
        if (!payment_data) {
          return NextResponse.json({ error: 'Payment data is required for payment emails' }, { status: 400 })
        }
        result = await EmailAPIWrapper.sendPaymentConfirmation({
          paymentData: payment_data,
          bookingOrQuotation: booking as any,
          language: language as 'en' | 'ja',
          bccEmails: bcc_emails
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    if (!result.success) {
      console.error('❌ [UNIFIED-BOOKING-EMAIL-API] Email sending failed:', result.error)
      return NextResponse.json({ 
        error: result.error || 'Failed to send email' 
      }, { status: 500 })
    }

    console.log(`✅ [UNIFIED-BOOKING-EMAIL-API] Booking email sent successfully: ${booking_id}`)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      bookingId: booking_id,
      emailType: email_type,
      language
    })

  } catch (error) {
    console.error('❌ [UNIFIED-BOOKING-EMAIL-API] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
