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
    // Handle both JSON and FormData requests
    let bookingId: string
    let email: string
    let language: string
    let bccEmails: string

    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      // Handle JSON request
      const body = await request.json()
      bookingId = body.bookingId || body.booking_id
      email = body.email || body.customer_email || 'admin.rixou@gmail.com' // Default email if not provided
      language = body.language || 'en'
      bccEmails = Array.isArray(body.bccEmails) ? body.bccEmails.join(',') : (body.bccEmails || body.bcc_emails || 'booking@japandriver.com')
    } else {
      // Handle FormData request
      const formData = await request.formData()
      bookingId = formData.get('booking_id') as string
      email = formData.get('email') as string
      language = (formData.get('language') as string) || 'en'
      bccEmails = formData.get('bcc_emails') as string || 'booking@japandriver.com'
    }

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    console.log(`🔄 [MIGRATED-BOOKING-DETAILS-API] Processing booking ${bookingId} for ${email}`)

    // Get booking data
    const supabase = createServiceClient()
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('❌ [MIGRATED-BOOKING-DETAILS-API] Booking not found:', bookingError)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    console.log('✅ [MIGRATED-BOOKING-DETAILS-API] Booking found:', !!booking, 'Keys:', Object.keys(booking || {}).length)

    // Get selected package if exists (bookings don't have packages, skip for now)
    // let selectedPackage: PricingPackage | null = null

    // Get selected promotion if exists (bookings don't have promotions, skip for now)
    // let selectedPromotion: PricingPromotion | null = null

    // Generate magic link for booking (skip for now, not critical for booking details)
    console.log('🔄 [MIGRATED-BOOKING-DETAILS-API] Skipping magic link generation for booking details')
    let magicLink = ''

    // Prepare template variables for booking
    const templateVariables = {
      // Customer information
      customer_name: booking.customer_name || 'Customer',
      customer_email: booking.customer_email || email,
      customer_phone: booking.customer_phone || '',
      
      // Booking information
      booking_id: booking.wp_id || booking.id.slice(-6).toUpperCase(),
      booking_number: booking.wp_id || booking.id.slice(-6).toUpperCase(),
      booking_date: booking.date ? new Date(booking.date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US') : '',
      confirmation_date: booking.created_at ? new Date(booking.created_at).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US') : '',
      
      // Service information (single service structure)
      service_name: booking.service_name || booking.service_type || 'Service',
      service_type: booking.service_type || 'Transportation Service',
      service_type_name: booking.service_type || 'Transportation Service',
      vehicle_type: `${booking.vehicle_make || ''} ${booking.vehicle_model || ''}`.trim() || 'Standard Vehicle',
      vehicle_make: booking.vehicle_make || '',
      vehicle_model: booking.vehicle_model || '',
      vehicle_capacity: booking.vehicle_capacity || 4,
      
      // Location and timing
      pickup_location: booking.pickup_location || '',
      dropoff_location: booking.dropoff_location || '',
      pickup_date: booking.date ? new Date(booking.date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US') : '',
      pickup_time: booking.time || '',
      date: booking.date ? new Date(booking.date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US') : '',
      time: booking.time || '',
      
      // Passenger and bag details
      number_of_passengers: booking.number_of_passengers || 1,
      number_of_bags: booking.number_of_bags || 0,
      passenger_count: booking.number_of_passengers || 1,
      
      // Service duration
      duration_hours: booking.duration_hours || 1,
      service_days: booking.service_days || 1,
      hours_per_day: booking.hours_per_day || 8,
      service_days_display: (booking.service_days && booking.service_days > 1) ? ` (${booking.service_days} days)` : '',
      
      // Flight details
      flight_number: booking.flight_number || '',
      terminal: booking.terminal || '',
      
      // Driver information (if available)
      driver_name: booking.driver_id ? 'Driver Name' : '', // Will be populated when driver is assigned
      driver_phone: booking.driver_id ? 'Driver Phone' : '', // Will be populated when driver is assigned
      
      // Pricing information
      amount: booking.base_amount || booking.price_amount || 0,
      currency: booking.price_currency || 'JPY',
      discount_percentage: booking.discount_percentage || 0,
      tax_percentage: booking.tax_percentage || 0,
      total_amount: booking.price_amount || booking.base_amount || 0,
      
      // Pricing breakdown variables - Calculate actual values
      unit_price: booking.base_amount || booking.price_amount || 0,
      total_price: booking.price_amount || booking.base_amount || 0,
      service_total: booking.price_amount || booking.base_amount || 0,
      
      // Calculate pricing breakdown
      base_amount: booking.base_amount || booking.price_amount || 0,
      tax_percentage: parseFloat(booking.tax_percentage) || 0,
      discount_percentage: parseFloat(booking.discount_percentage) || 0,
      
      // Calculate tax amount
      tax_amount: (() => {
        const base = booking.base_amount || booking.price_amount || 0
        const taxRate = parseFloat(booking.tax_percentage) || 0
        return Math.round(base * (taxRate / 100))
      })(),
      
      // Calculate discount amount
      regular_discount: (() => {
        const base = booking.base_amount || booking.price_amount || 0
        const discountRate = parseFloat(booking.discount_percentage) || 0
        return Math.round(base * (discountRate / 100))
      })(),
      
      // Calculate subtotal (base amount - discount)
      subtotal: (() => {
        const base = booking.base_amount || booking.price_amount || 0
        const discountRate = parseFloat(booking.discount_percentage) || 0
        const discount = Math.round(base * (discountRate / 100))
        return base - discount
      })(),
      
      // Promotion discount (not used in booking details)
      promotion_discount: 0,
      
      // Final total (subtotal + tax)
      final_total: (() => {
        const base = booking.base_amount || booking.price_amount || 0
        const discountRate = parseFloat(booking.discount_percentage) || 0
        const taxRate = parseFloat(booking.tax_percentage) || 0
        const discount = Math.round(base * (discountRate / 100))
        const subtotal = base - discount
        const tax = Math.round(subtotal * (taxRate / 100))
        return subtotal + tax
      })(),
      
      // Package and promotion (not used in booking details)
      selected_package_name: '',
      selected_package_description: '',
      selected_promotion_name: '',
      selected_promotion_code: '',
      
      // Dates
      created_at: booking.created_at ? new Date(booking.created_at).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US') : '',
      updated_at: booking.updated_at ? new Date(booking.updated_at).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US') : '',
      
      // Magic link and payment
      magic_link: magicLink,
      payment_required: 'false', // Booking details don't require payment
      payment_link: '', // No payment link for booking details
      
      // Localization
      language,
      team_location: booking.team_location || 'japan',
      
      // Greeting message - Booking specific
      greeting_text: language === 'ja' 
        ? 'ご予約の詳細をお送りいたします。'
        : 'Please find your booking details below.',
      
      // Subtitle for email header - use team name
      subtitle: booking.team_location === 'thailand' ? 'Driver Thailand' : 'Driver Japan',
      
      // Title for email header (without booking number)
      email_title: 'Your Booking Details'
    }

    console.log('🔄 [MIGRATED-BOOKING-DETAILS-API] Using direct template service')
    
      // Booking details don't need PDF attachment
      console.log('🔄 [MIGRATED-BOOKING-DETAILS-API] Skipping PDF attachment for booking details')
      const pdfAttachment = null

      // Prepare email data (will be used later)
      const emailData = {
        from: 'booking@japandriver.com',
        to: [email],
        bcc: bccEmails ? bccEmails.split(',').map((email: string) => email.trim()) : ['admin.rixou@gmail.com']
      }

    console.log('🔄 [MIGRATED-BOOKING-DETAILS-API] Sending email with template service')
    
    // Render the template using emailTemplateService directly (same as quotation routes)
    const rendered = await emailTemplateService.renderTemplate(
      'Booking Details',
      templateVariables,
      'japan',
      language as 'en' | 'ja'
    )

    if (!rendered) {
      console.error('❌ [MIGRATED-BOOKING-DETAILS-API] Template rendering failed')
      return NextResponse.json({ error: 'Failed to render template' }, { status: 500 })
    }

    console.log('✅ [MIGRATED-BOOKING-DETAILS-API] Template rendered successfully')

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

    console.log('🔄 [MIGRATED-BOOKING-DETAILS-API] Sending email')
    const { data, error: sendError } = await resend.emails.send(finalEmailData)

    if (sendError) {
      console.error('❌ [MIGRATED-BOOKING-DETAILS-API] Resend error:', JSON.stringify(sendError, null, 2))
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
      console.log('✅ [MIGRATED-BOOKING-DETAILS-API] Email sent successfully:', emailResult.messageId)
      
      // Update booking status if needed
      await supabase
        .from('bookings')
        .update({ 
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
      console.error('❌ [MIGRATED-BOOKING-DETAILS-API] Email sending failed')
      return NextResponse.json({ 
        error: 'Failed to send email' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [MIGRATED-BOOKING-DETAILS-API] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}