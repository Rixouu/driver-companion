import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { PricingPackage, PricingPromotion } from '@/types/quotations'
import { emailTemplateService } from '@/lib/email/template-service'
import { Resend } from 'resend'
import { generateOptimizedPdfFromHtml } from '@/lib/optimized-html-pdf-generator'
import { generateBookingInvoiceHtml } from '@/lib/booking-invoice-generator'

// =============================================================================
// MIGRATED BOOKING INVOICE EMAIL API - Now uses unified notification templates
// =============================================================================
// This route has been migrated from hardcoded templates to the unified system.

export async function POST(request: NextRequest) {
  console.log('🔄 [MIGRATED-BOOKING-INVOICE-API] Processing booking invoice email request')
  
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
      
      console.log('📧 [MIGRATED-BOOKING-INVOICE-API] JSON request data:', {
        bookingId,
        email,
        language,
        bccEmails
      })
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

    console.log(`🔄 [MIGRATED-BOOKING-INVOICE-API] Processing booking ${bookingId} for ${email}`)

    // Get booking data
    const supabase = createServiceClient()
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('❌ [MIGRATED-BOOKING-INVOICE-API] Booking not found:', bookingError)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    console.log('✅ [MIGRATED-BOOKING-INVOICE-API] Booking found:', !!booking, 'Keys:', Object.keys(booking || {}).length)

    // Generate payment link for booking invoice
    console.log('🔄 [MIGRATED-BOOKING-INVOICE-API] Generating payment link for booking invoice')
    let paymentLink = ''
    try {
      const paymentLinkResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bookings/generate-payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          booking_id: bookingId,
          customer_email: email
        })
      })
      
      if (paymentLinkResponse.ok) {
        const paymentLinkData = await paymentLinkResponse.json()
        paymentLink = paymentLinkData.payment_link || ''
        console.log('✅ [MIGRATED-BOOKING-INVOICE-API] Payment link generated:', !!paymentLink)
      } else {
        console.warn('⚠️ [MIGRATED-BOOKING-INVOICE-API] Payment link generation failed:', paymentLinkResponse.status)
      }
    } catch (error) {
      console.warn('⚠️ [MIGRATED-BOOKING-INVOICE-API] Payment link generation error:', error)
    }

    // Prepare template variables for booking invoice
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
      
      // Driver information (if available)
      driver_name: booking.driver_id ? 'Driver Name' : '', // Will be populated when driver is assigned
      driver_phone: booking.driver_id ? 'Driver Phone' : '', // Will be populated when driver is assigned
      
      // Pricing information
      amount: booking.base_amount || booking.price_amount || 0,
      currency: booking.price_currency || 'JPY',
      discount_percentage: booking.discount_percentage || 0,
      tax_percentage: booking.tax_percentage || 0,
      total_amount: booking.price_amount || booking.base_amount || 0,
      
      // Invoice dates - Format as DD/MM/YYYY
      issue_date: (() => {
        const date = new Date()
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      })(),
      due_date: (() => {
        const date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      })(),
      
      // Payment information - Invoice requires payment
      payment_required: 'true', // Show payment section for invoice
      payment_link: paymentLink || '', // Payment link for customer to pay
      payment_status: booking.status === 'paid' ? 'PAID' : 'PENDING PAYMENT', // Actual payment status
      
      // Localization
      language,
      team_location: booking.team_location || 'japan',
      
      // Greeting message - Invoice specific (payment required)
      greeting_text: language === 'ja' 
        ? '予約の請求書をお送りいたします。下記のリンクからお支払いをお願いいたします。'
        : 'Please find your booking invoice below. You can complete your payment using the link provided.'
    }

    console.log('🔄 [MIGRATED-BOOKING-INVOICE-API] Using direct template service')
    
    // Generate booking invoice PDF directly using the PDF generator
    console.log('🔄 [MIGRATED-BOOKING-INVOICE-API] Generating booking invoice PDF directly')
    let pdfAttachment = null
    try {
      // Import the PDF generator function directly
      const { generateOptimizedPdfFromHtml } = await import('@/lib/optimized-html-pdf-generator')
      
      // Generate proper booking invoice HTML using the existing template system
      const invoiceHtml = await generateBookingInvoiceHtml(
        booking,
        language as 'en' | 'ja'
      )
      
      // Generate PDF
      const pdfBuffer = await generateOptimizedPdfFromHtml(invoiceHtml, {
        format: 'A4',
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
      })
      
      console.log('📄 [MIGRATED-BOOKING-INVOICE-API] PDF generated directly, size:', pdfBuffer.length, 'bytes')
      
      pdfAttachment = {
        filename: `INV-BOOK-JPDR-${(booking.wp_id || booking.id.slice(-6)).toString().padStart(6, '0')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
      console.log('✅ [MIGRATED-BOOKING-INVOICE-API] Booking invoice PDF generated:', pdfAttachment.filename, 'Size:', pdfAttachment.content.length, 'bytes')
    } catch (error) {
      console.warn('⚠️ [MIGRATED-BOOKING-INVOICE-API] Could not generate booking invoice PDF:', error)
    }

    // Prepare email data (will be used later)
    const emailData = {
      from: 'booking@japandriver.com',
      to: [email],
      bcc: bccEmails ? bccEmails.split(',').map((email: string) => email.trim()) : ['admin.rixou@gmail.com'],
      ...(pdfAttachment && { attachments: [pdfAttachment] })
    }
    
    console.log('📧 [MIGRATED-BOOKING-INVOICE-API] Email data prepared:', {
      to: emailData.to,
      bcc: emailData.bcc,
      hasAttachments: !!pdfAttachment,
      attachmentFilename: pdfAttachment?.filename
    })

    console.log('🔄 [MIGRATED-BOOKING-INVOICE-API] Sending email with template service')
    console.log('🔍 [MIGRATED-BOOKING-INVOICE-API] Template variables:', JSON.stringify(templateVariables, null, 2))
    
    // Render the template using emailTemplateService directly (same as quotation routes)
    const rendered = await emailTemplateService.renderTemplate(
      'Booking Invoice',
      templateVariables,
      'japan',
      language as 'en' | 'ja'
    )

    if (!rendered) {
      console.error('❌ [MIGRATED-BOOKING-INVOICE-API] Template rendering failed')
      return NextResponse.json({ error: 'Failed to render template' }, { status: 500 })
    }

    console.log('✅ [MIGRATED-BOOKING-INVOICE-API] Template rendered successfully')

    // Send email using Resend directly (same as quotation routes)
    const resend = new Resend(process.env.RESEND_API_KEY)
    const finalEmailData = {
      from: 'Driver Japan <booking@japandriver.com>',
      to: email,
      bcc: bccEmails.split(',').map(e => e.trim()).filter(e => e),
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      ...(pdfAttachment && { attachments: [pdfAttachment] })
    }

    console.log('📧 [MIGRATED-BOOKING-INVOICE-API] Final email data:', {
      to: finalEmailData.to,
      bcc: finalEmailData.bcc,
      subject: finalEmailData.subject,
      hasAttachments: !!finalEmailData.attachments,
      attachmentCount: finalEmailData.attachments?.length || 0,
      attachmentFilename: finalEmailData.attachments?.[0]?.filename
    })

    console.log('🔄 [MIGRATED-BOOKING-INVOICE-API] Sending email')
    const { data, error: sendError } = await resend.emails.send(finalEmailData)

    if (sendError) {
      console.error('❌ [MIGRATED-BOOKING-INVOICE-API] Resend error:', JSON.stringify(sendError, null, 2))
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
      console.log('✅ [MIGRATED-BOOKING-INVOICE-API] Email sent successfully:', emailResult.messageId)
      
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
      console.error('❌ [MIGRATED-BOOKING-INVOICE-API] Email sending failed')
      return NextResponse.json({ 
        error: 'Failed to send email' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [MIGRATED-BOOKING-INVOICE-API] Unexpected error:', error)
    console.error('❌ [MIGRATED-BOOKING-INVOICE-API] Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}