import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { emailTemplateService } from '@/lib/email/template-service'
import { Resend } from 'resend'

// =============================================================================
// MIGRATED BOOKING PAYMENT COMPLETE EMAIL API - Now uses unified notification templates
// =============================================================================
// This route has been migrated from hardcoded templates to the unified system.

export async function POST(request: NextRequest) {
  console.log('🔄 [MIGRATED-BOOKING-PAYMENT-COMPLETE-API] Processing booking payment complete email request')
  
  try {
    // Handle both JSON and FormData requests
    let bookingId: string
    let email: string
    let language: string
    let bccEmails: string
    let paymentData: any = null

    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      // Handle JSON request
      const body = await request.json()
      bookingId = body.bookingId || body.booking_id
      email = body.email || body.customer_email || 'admin.rixou@gmail.com' // Default email if not provided
      language = body.language || 'en'
      bccEmails = Array.isArray(body.bccEmails) ? body.bccEmails.join(',') : (body.bccEmails || body.bcc_emails || 'booking@japandriver.com')
      paymentData = body.paymentData || body.payment_data || null
    } else {
      // Handle FormData request
      const formData = await request.formData()
      bookingId = formData.get('booking_id') as string
      email = formData.get('email') as string
      language = (formData.get('language') as string) || 'en'
      bccEmails = formData.get('bcc_emails') as string || 'booking@japandriver.com'
      paymentData = formData.get('payment_data') ? JSON.parse(formData.get('payment_data') as string) : null
    }

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    console.log(`🔄 [MIGRATED-BOOKING-PAYMENT-COMPLETE-API] Processing booking ${bookingId} for ${email}`)

    // Get booking data
    const supabase = createServiceClient()
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('❌ [MIGRATED-BOOKING-PAYMENT-COMPLETE-API] Booking not found:', bookingError)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    console.log('✅ [MIGRATED-BOOKING-PAYMENT-COMPLETE-API] Booking found:', !!booking, 'Keys:', Object.keys(booking || {}).length)

    // Prepare template variables for booking payment complete
    const templateVariables = {
      // Customer information
      customer_name: booking.customer_name || 'Customer',
      customer_email: booking.customer_email || email,
      customer_phone: booking.customer_phone || '',
      
      // Booking information
      booking_id: booking.wp_id || booking.id.slice(-6).toUpperCase(),
      booking_number: booking.wp_id || booking.id.slice(-6).toUpperCase(),
      service_name: booking.service_name || booking.service_type || 'Service',
      vehicle_make: booking.vehicle_make || '',
      vehicle_model: booking.vehicle_model || '',
      vehicle_capacity: booking.vehicle_capacity || 4,
      pickup_location: booking.pickup_location || '',
      dropoff_location: booking.dropoff_location || '',
      date: booking.date ? new Date(booking.date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US') : '',
      time: booking.time || '',
      passenger_count: booking.number_of_passengers || 1,
      duration_hours: booking.duration_hours || 1,
      service_days: booking.service_days || 1,
      
      // Payment information
      amount: booking.base_amount || booking.price_amount || 0,
      currency: booking.price_currency || 'JPY',
      total_amount: booking.price_amount || booking.base_amount || 0,
      payment_status: 'Completed',
      payment_date: new Date().toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US'),
      payment_method: paymentData?.payment_method || 'Online Payment',
      payment_reference: paymentData?.payment_reference || 'N/A',
      
      // Driver information (if available)
      driver_name: booking.driver_id ? 'Driver Name' : '', // Will be populated when driver is assigned
      driver_phone: booking.driver_id ? 'Driver Phone' : '', // Will be populated when driver is assigned
      
      // Localization
      language,
      team_location: booking.team_location || 'japan',
      
      // Greeting message - Payment complete specific
      greeting_text: language === 'ja' 
        ? 'お支払いが完了いたしました。ご予約の詳細をお送りいたします。'
        : 'Your payment has been completed successfully. Please find your booking details below.'
    }

    console.log('🔄 [MIGRATED-BOOKING-PAYMENT-COMPLETE-API] Using direct template service')
    
    // Prepare email data (will be used later)
    const emailData = {
      from: 'booking@japandriver.com',
      to: [email],
      bcc: bccEmails ? bccEmails.split(',').map((email: string) => email.trim()) : ['admin.rixou@gmail.com']
    }

    console.log('🔄 [MIGRATED-BOOKING-PAYMENT-COMPLETE-API] Sending email with template service')
    
    // Render the template using emailTemplateService directly (same as quotation routes)
    const rendered = await emailTemplateService.renderTemplate(
      'Payment Complete',
      templateVariables,
      'japan',
      language as 'en' | 'ja'
    )

    if (!rendered) {
      console.error('❌ [MIGRATED-BOOKING-PAYMENT-COMPLETE-API] Template rendering failed')
      return NextResponse.json({ error: 'Failed to render template' }, { status: 500 })
    }

    console.log('✅ [MIGRATED-BOOKING-PAYMENT-COMPLETE-API] Template rendered successfully')

    // Send email using Resend directly (same as quotation routes)
    const resend = new Resend(process.env.RESEND_API_KEY)
    const finalEmailData = {
      from: 'Driver Japan <booking@japandriver.com>',
      to: email,
      bcc: bccEmails.split(',').map(e => e.trim()).filter(e => e),
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text
    }

    console.log('🔄 [MIGRATED-BOOKING-PAYMENT-COMPLETE-API] Sending email')
    const { data, error: sendError } = await resend.emails.send(finalEmailData)

    if (sendError) {
      console.error('❌ [MIGRATED-BOOKING-PAYMENT-COMPLETE-API] Resend error:', JSON.stringify(sendError, null, 2))
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: sendError
      }, { status: 500 })
    }
    
    const emailResult = {
      success: true,
      messageId: data?.id || 'unknown'
    }

    if (emailResult.success) {
      console.log('✅ [MIGRATED-BOOKING-PAYMENT-COMPLETE-API] Email sent successfully:', emailResult.messageId)
      
      // Update booking payment status
      await supabase
        .from('bookings')
        .update({ 
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      return NextResponse.json({
        success: true,
        messageId: emailResult.messageId,
        bookingId,
        email,
        language,
        isUpdated: true
      })
    } else {
      console.error('❌ [MIGRATED-BOOKING-PAYMENT-COMPLETE-API] Email sending failed')
      return NextResponse.json({ 
        error: 'Failed to send email' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [MIGRATED-BOOKING-PAYMENT-COMPLETE-API] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}