import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { emailTemplateService } from '@/lib/email/template-service'
import { Resend } from 'resend'

// =============================================================================
// MIGRATED BOOKING DETAILS EMAIL API - Now uses unified notification templates
// =============================================================================
// This route has been migrated from hardcoded templates to the unified system.

export async function POST(request: NextRequest) {
  console.log('🔄 [MIGRATED-BOOKING-DETAILS-API] Processing booking details email request')
  
  try {
    const body = await request.json()
    const bookingId = body.bookingId || body.booking_id
    const email = body.email
    const language = body.language || 'en'
    const bccEmails = body.bccEmails || body.bcc_emails || 'admin.rixou@gmail.com'

    if (!bookingId || !email) {
      console.error('❌ [MIGRATED-BOOKING-DETAILS-API] Missing required fields')
      return NextResponse.json(
        { error: 'bookingId and email are required' },
        { status: 400 }
      )
    }

    console.log(`🔄 [MIGRATED-BOOKING-DETAILS-API] Processing booking ${bookingId} for ${email}`)

    // Get booking data - try both id and wp_id
    const supabase = createServiceClient()
    let { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    // If not found by id, try wp_id
    if (bookingError && bookingId.includes('-')) {
      console.log('🔄 [MIGRATED-BOOKING-DETAILS-API] Trying wp_id search...')
      const { data: bookingByWpId, error: wpIdError } = await supabase
        .from('bookings')
        .select('*')
        .eq('wp_id', bookingId)
        .single()
      
      if (!wpIdError && bookingByWpId) {
        booking = bookingByWpId
        bookingError = null
        console.log('✅ [MIGRATED-BOOKING-DETAILS-API] Found booking by wp_id')
      }
    }

    if (bookingError || !booking) {
      console.error('❌ [MIGRATED-BOOKING-DETAILS-API] Booking not found:', bookingError)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    console.log('✅ [MIGRATED-BOOKING-DETAILS-API] Booking data fetched successfully')

    // Get template variables for booking
    const templateVariables = {
      // Customer information
      customer_name: booking.customer_name || 'Customer',
      customer_email: booking.customer_email || email,
      customer_phone: booking.customer_phone || '',
      
      // Booking information
      booking_id: booking.id,
      booking_number: booking.wp_id || booking.booking_number || booking.id.slice(-6).toUpperCase(),
      service_name: booking.service_name || booking.service_type || 'Service',
      service_type: booking.service_type || 'Service',
      vehicle_type: booking.vehicle_type || 'Vehicle',
      pickup_location: booking.pickup_location || '',
      dropoff_location: booking.dropoff_location || '',
      pickup_date: booking.date ? new Date(booking.date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US') : '',
      pickup_time: booking.time || '',
      date: booking.date ? new Date(booking.date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US') : '',
      time: booking.time || '',
      booking_date: booking.date ? new Date(booking.date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US') : '',
      booking_time: booking.time || '',
      passenger_count: booking.passenger_count || '',
      duration_hours: booking.duration_hours || '',
      service_days: booking.service_days || '',
      
      // Driver and vehicle information
      driver_name: booking.driver_name || '',
      driver_phone: booking.driver_phone || '',
      vehicle_make: booking.vehicle_make || '',
      vehicle_model: booking.vehicle_model || booking.vehicle_type || 'Vehicle',
      vehicle_capacity: booking.vehicle_capacity || '',
      license_plate: booking.license_plate || '',
      
      // Pricing information
      amount: booking.price_amount || booking.amount || 0,
      currency: booking.price_currency || booking.currency || 'JPY',
      total_amount: booking.price_amount || booking.total_amount || booking.amount || 0,
      
      // Calendar link
      calendar_link: booking.calendar_link || '',
      
      // Additional template variables
      primary_color: '#3b82f6',
      
      // Localization
      language,
      team_location: booking.team_location || 'japan',
      
      // Greeting message
      greeting_text: language === 'ja' 
        ? 'ご予約の詳細をお送りいたします。'
        : 'Please find your booking details below.'
    }

    console.log('🔄 [MIGRATED-BOOKING-DETAILS-API] Using direct template service')
    
    // Get email template from database
    console.log('🔄 [MIGRATED-BOOKING-DETAILS-API] Fetching template: Booking Details, category: booking, language:', language)
    const template = await emailTemplateService.getTemplate('Booking Details', 'booking', language)
    if (!template) {
      console.error('❌ [MIGRATED-BOOKING-DETAILS-API] Template not found for Booking Details')
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 })
    }
    console.log('✅ [MIGRATED-BOOKING-DETAILS-API] Template found:', template.name)

    // Render the template using emailTemplateService directly
    console.log('🔄 [MIGRATED-BOOKING-DETAILS-API] Rendering template with variables:', Object.keys(templateVariables))
    console.log('🔄 [MIGRATED-BOOKING-DETAILS-API] Sample variables:', {
      customer_name: templateVariables.customer_name,
      booking_id: templateVariables.booking_id,
      service_name: templateVariables.service_name,
      language: templateVariables.language
    })
    
    const rendered = await emailTemplateService.renderTemplate(
      'Booking Details',
      templateVariables,
      'japan',
      language as 'en' | 'ja'
    )

    if (!rendered) {
      console.error('❌ [MIGRATED-BOOKING-DETAILS-API] Template rendering failed')
      return NextResponse.json({ error: 'Failed to render email template' }, { status: 500 })
    }

    console.log('✅ [MIGRATED-BOOKING-DETAILS-API] Template rendered successfully')
    console.log('✅ [MIGRATED-BOOKING-DETAILS-API] Rendered content length:', rendered.html?.length)
    console.log('✅ [MIGRATED-BOOKING-DETAILS-API] Rendered subject:', rendered.subject)
    console.log('✅ [MIGRATED-BOOKING-DETAILS-API] Rendered content preview:', rendered.html?.substring(0, 200))
    
    // Check if content is empty or null
    if (!rendered.html || rendered.html.trim().length === 0) {
      console.error('❌ [MIGRATED-BOOKING-DETAILS-API] Rendered content is empty!')
      return NextResponse.json({ error: 'Template rendered empty content' }, { status: 500 })
    }

    // Send email using Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const emailData = {
      from: 'booking@japandriver.com',
      to: [email],
      bcc: bccEmails ? bccEmails.split(',').map((email: string) => email.trim()) : ['admin.rixou@gmail.com'],
      subject: rendered.subject,
      html: rendered.html,
    }

    console.log('📧 [MIGRATED-BOOKING-DETAILS-API] Sending email via Resend...')
    console.log('📧 [MIGRATED-BOOKING-DETAILS-API] Email data:', {
      from: emailData.from,
      to: emailData.to,
      bcc: emailData.bcc,
      subject: emailData.subject,
      htmlLength: emailData.html?.length
    })
    
    const result = await resend.emails.send(emailData)

    if (result.error) {
      console.error('❌ [MIGRATED-BOOKING-DETAILS-API] Resend error:', result.error)
      return NextResponse.json({ error: 'Failed to send email', details: result.error }, { status: 500 })
    }

    console.log('✅ [MIGRATED-BOOKING-DETAILS-API] Email sent successfully:', result.data?.id)

    return NextResponse.json({
      success: true,
      messageId: result.data?.id,
      bookingId: bookingId,
      email: email,
      language: language,
      isUpdated: true
    })

  } catch (error) {
    console.error('❌ [MIGRATED-BOOKING-DETAILS-API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}