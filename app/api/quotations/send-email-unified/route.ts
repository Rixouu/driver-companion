import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { EmailAPIWrapper } from '@/lib/services/email-api-wrapper'
import { PricingPackage, PricingPromotion } from '@/types/quotations'
import { emailTemplateService } from '@/lib/email/template-service'
import { Resend } from 'resend'
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator'

// =============================================================================
// UNIFIED QUOTATION EMAIL API - Clean & Fast
// =============================================================================

export async function POST(request: NextRequest) {
  console.log('🚀 [UNIFIED-EMAIL-API] ROUTE CALLED - TESTING LOGGING')
  console.log('🔄 [UNIFIED-EMAIL-API] Starting quotation email process')
  
  try {
    // Handle both JSON and FormData requests
    let quotationId: string
    let email: string
    let language: string
    let bccEmails: string

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // Handle JSON request
      const body = await request.json()
      quotationId = body.quotation_id
      email = body.email
      language = body.language || 'en'
      bccEmails = body.bcc_emails || 'booking@japandriver.com'
    } else {
      // Handle FormData request
      const formData = await request.formData()
      quotationId = formData.get('quotation_id') as string
      email = formData.get('email') as string
      language = (formData.get('language') as string) || 'en'
      bccEmails = formData.get('bcc_emails') as string || 'booking@japandriver.com'
    }

    if (!quotationId) {
      return NextResponse.json({ error: 'Quotation ID is required' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    console.log(`🔄 [UNIFIED-EMAIL-API] Processing quotation ${quotationId} for ${email}`)

    // Helper function to format date to DD/MM/YYYY
    const formatDateToDDMMYYYY = (dateString: string | null | undefined): string => {
      if (!dateString) return 'TBD'
      try {
        const date = new Date(dateString)
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      } catch {
        return 'TBD'
      }
    }

    // Get quotation data
    const supabase = createServiceClient()
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single()

    if (quotationError || !quotation) {
      console.error('❌ [UNIFIED-EMAIL-API] Quotation not found:', quotationError)
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }
    
    console.log('✅ [UNIFIED-EMAIL-API] Quotation found:', !!quotation, 'Keys:', Object.keys(quotation || {}).length)

    // Get selected package if exists
    let selectedPackage: PricingPackage | null = null
    if (quotation.selected_package_id) {
      const { data: packageData } = await supabase
        .from('pricing_packages')
        .select('*')
        .eq('id', quotation.selected_package_id)
        .single()
      selectedPackage = packageData as PricingPackage | null
    }

    // Get selected promotion if exists
    let selectedPromotion: PricingPromotion | null = null
    if (quotation.selected_promotion_id) {
      const { data: promotionData } = await supabase
        .from('pricing_promotions')
        .select('*')
        .eq('id', quotation.selected_promotion_id)
        .single()
      selectedPromotion = promotionData as PricingPromotion | null
    }

    // Generate magic link (if needed)
    let magicLink: string | null = null
    try {
      // Auto-detect environment from request headers for dynamic base URL
      const host = request.headers.get('host') || '';
      let baseUrl;
      if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('3000')) {
        baseUrl = 'http://localhost:3000';
      } else if (host.includes('my.japandriver.com')) {
        baseUrl = 'https://my.japandriver.com';
      } else {
        // Fallback to environment variables or default
        baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://my.japandriver.com';
      }
      
      const magicLinkResponse = await fetch(`${baseUrl}/api/quotations/create-magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quotation_id: quotationId, 
          customer_email: quotation.customer_email 
        })
      })
      
      if (magicLinkResponse.ok) {
        const magicLinkData = await magicLinkResponse.json()
        magicLink = magicLinkData.magic_link
        console.log('✅ [UNIFIED-EMAIL-API] Magic link generated:', magicLink)
      } else {
        console.error('❌ [UNIFIED-EMAIL-API] Magic link generation failed:', await magicLinkResponse.text())
      }
    } catch (error) {
      console.warn('⚠️ [UNIFIED-EMAIL-API] Could not generate magic link:', error)
    }

    // Determine if this is an updated quotation
    const isUpdated = (quotation.status === 'sent' && quotation.updated_at) || 
                     (quotation.updated_at && quotation.created_at && 
                      new Date(quotation.updated_at).getTime() > new Date(quotation.created_at).getTime() + 60000)

    console.log(`✅ [UNIFIED-EMAIL-API] Quotation data prepared: ${quotationId}`)

    console.log('🔄 [UNIFIED-EMAIL-API] Raw quotation data:', JSON.stringify({
      id: quotation.id,
      quote_number: quotation.quote_number,
      customer_name: quotation.customer_name,
      service_type: quotation.service_type,
      vehicle_type: quotation.vehicle_type,
      pickup_date: quotation.pickup_date,
      pickup_time: quotation.pickup_time
    }, null, 2))
    
    // Transform database quotation data to match EmailVariableMapper interface
    const transformedQuotation = {
      id: quotation.id,
      quote_number: quotation.quote_number,
      customer_name: quotation.customer_name,
      customer_email: quotation.customer_email,
      service_type: quotation.service_type,
      vehicle_type: quotation.vehicle_type,
      duration_hours: quotation.duration_hours,
      service_days: quotation.service_days || 1,
      hours_per_day: quotation.hours_per_day || quotation.duration_hours || 1,
      
      // Fix field name mismatches
      pickup_location: quotation.pickup_location || `${quotation.customer_notes || 'Pick up location'}`,
      dropoff_location: quotation.dropoff_location || `${quotation.merchant_notes || 'Drop off location'}`,
      date: formatDateToDDMMYYYY(quotation.pickup_date),
      time: quotation.pickup_time,
      
      // Fix currency and pricing fields
      currency: quotation.currency,
      display_currency: quotation.display_currency || quotation.currency,
      total_amount: quotation.total_amount,
      service_total: quotation.amount || quotation.total_amount,
      subtotal: quotation.amount || quotation.total_amount,
      tax_amount: quotation.total_amount * ((quotation.tax_percentage || 0) / 100),
      tax_percentage: quotation.tax_percentage,
      discount_percentage: quotation.discount_percentage,
      regular_discount: quotation.amount * ((quotation.discount_percentage || 0) / 100),
      promotion_discount: quotation.promotion_discount || 0,
      final_total: quotation.total_amount,
      
      // Add missing fields - Set expiry to 2 days from now in DD/MM/YYYY format
      expiry_date: (() => {
        const now = new Date()
        const expiryDate = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)) // 2 days from now
        const day = expiryDate.getDate().toString().padStart(2, '0')
        const month = (expiryDate.getMonth() + 1).toString().padStart(2, '0')
        const year = expiryDate.getFullYear()
        return `${day}/${month}/${year}`
      })(),
      service_name: quotation.service_type, // Template uses service_name
      
      // Package and promotion codes
      selected_package_code: quotation.selected_package_name,
      selected_promotion_code: quotation.selected_promotion_code,
      
      // Status and metadata
      status: quotation.status,
      created_at: quotation.created_at,
      updated_at: quotation.updated_at,
      last_sent_at: quotation.updated_at || quotation.created_at,
      team_location: quotation.team_location || 'japan'
    }

    console.log(`🔄 [UNIFIED-EMAIL-API] Transformed data:`, {
      date: transformedQuotation.date,
      time: transformedQuotation.time,
      service_type: transformedQuotation.service_type,
      total_amount: transformedQuotation.total_amount,
      currency: transformedQuotation.currency
    })

    console.log('🔄 [UNIFIED-EMAIL-API] Starting template variable creation')
    
    // Complete template variables with all required data  
    const templateVariables = {
      // Basic identifiers
      customer_name: quotation.customer_name || 'Valued Customer',
      quotation_id: `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`,
      quotation_number: quotation.quote_number,
      
      // Service details
      service_type: quotation.service_type || 'Transportation Service', 
      service_name: quotation.service_type || 'Transportation Service',
      vehicle_type: quotation.vehicle_type || 'Standard Vehicle',
      duration_hours: quotation.duration_hours || 1,
      
      // Charter Services specific fields
      service_days: quotation.service_days || 1,
      hours_per_day: quotation.hours_per_day || 8,
      service_type_charter: (quotation.service_type?.toLowerCase().includes('charter') || false) ? 'true' : 'false',
      
      // Pre-calculated service days display for Charter Services
      service_days_display: (() => {
        if (quotation.service_type?.toLowerCase().includes('charter') && quotation.service_days) {
          const days = quotation.service_days;
          const hours = quotation.hours_per_day || 8;
          return `(${days} ${language === 'ja' ? '日間' : 'day(s)'} × ${hours} ${language === 'ja' ? '時間/日' : 'h/day'})`;
        }
        return '';
      })(),
      
      // Location and timing
      pickup_location: quotation.pickup_location || quotation.customer_notes || 'Pick up location',
      dropoff_location: quotation.dropoff_location || quotation.merchant_notes || 'Drop off location', 
      date: formatDateToDDMMYYYY(quotation.pickup_date),
      time: quotation.pickup_time || 'TBD',
      
      // Financial information
      total_amount: quotation.total_amount || 0,
      amount: quotation.total_amount || 0,
      currency: quotation.currency || 'JPY',
      service_total: quotation.total_amount || 0,
      final_total: quotation.total_amount || 0,
      
      // Important dates - Set expiry to 2 days from now in DD/MM/YYYY format
      expiry_date: (() => {
        const now = new Date()
        const expiryDate = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)) // 2 days from now
        const day = expiryDate.getDate().toString().padStart(2, '0')
        const month = (expiryDate.getMonth() + 1).toString().padStart(2, '0')
        const year = expiryDate.getFullYear()
        return `${day}/${month}/${year}`
      })(),
      created_at: quotation.created_at,
      updated_at: quotation.updated_at,
      
      // Status and metadata
      status: quotation.status,
      is_updated: isUpdated.toString(),
      magic_link: magicLink || '', // Ensure it's always a string
      
      // Payment information - Quotations should NOT show payment block  
      payment_required: '', // Empty string evaluates to false in {{#if}} conditionals
      payment_link: '', // Empty for quotations
      
      // Localization
      language,
      team_location: quotation.team_location || 'japan',
      
      // Greeting message
      greeting_text: isUpdated 
        ? 'Thank you for your interest in our services. Please find your updated quotation below.'
        : 'Thank you for your interest in our services. Please find your quotation below.'
    }

    console.log('🔄 [UNIFIED-EMAIL-API] Using direct template service')
    
    // Generate quotation PDF attachment
    console.log('🔄 [UNIFIED-EMAIL-API] Generating quotation PDF attachment')
    let pdfAttachment = null
    try {
      const pdfBuffer = await generateOptimizedQuotationPDF(
        quotation,
        language,
        selectedPackage,
        selectedPromotion
      )
      
      pdfAttachment = {
        filename: `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || quotation.id.slice(-6).toUpperCase()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
      console.log('✅ [UNIFIED-EMAIL-API] PDF attachment generated:', pdfAttachment.filename)
    } catch (error) {
      console.warn('⚠️ [UNIFIED-EMAIL-API] Could not generate PDF attachment:', error)
    }
    
    // Render the template using emailTemplateService directly
    const rendered = await emailTemplateService.renderTemplate(
      'Quotation Sent',
      templateVariables,
      'japan',
      language as 'en' | 'ja'
    )

    if (!rendered) {
      console.error('❌ [UNIFIED-EMAIL-API] Template rendering failed')
      return NextResponse.json({ error: 'Failed to render template' }, { status: 500 })
    }

    console.log('✅ [UNIFIED-EMAIL-API] Template rendered successfully')

    // Send email using Resend directly  
    const resend = new Resend(process.env.RESEND_API_KEY)
    const emailData = {
      from: 'Driver Japan <booking@japandriver.com>',
      to: email,
      bcc: bccEmails.split(',').map(e => e.trim()).filter(e => e),
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      ...(pdfAttachment && { attachments: [pdfAttachment] })
    }

    console.log('🔄 [UNIFIED-EMAIL-API] Sending email')
    const { data, error: sendError } = await resend.emails.send(emailData)

    if (sendError) {
      console.error('❌ [UNIFIED-EMAIL-API] Resend error:', JSON.stringify(sendError, null, 2))
      console.error('❌ [UNIFIED-EMAIL-API] Email data used:', JSON.stringify(emailData, null, 2))
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: sendError,
        emailConfig: emailData 
      }, { status: 500 })
    }

    const result = { success: true, messageId: data?.id || 'unknown' }

    console.log('✅ [UNIFIED-EMAIL-API] Email sent successfully:', result.messageId)

    // Update quotation status to 'sent'
    try {
      const { error: updateError } = await supabase
        .from('quotations')
        .update({ 
          status: 'sent'
        })
        .eq('id', quotationId)
      
      if (updateError) {
        console.warn('⚠️ [UNIFIED-EMAIL-API] Could not update quotation status:', updateError)
      } else {
        console.log('✅ [UNIFIED-EMAIL-API] Quotation status updated to sent')
      }
    } catch (error) {
      console.warn('⚠️ [UNIFIED-EMAIL-API] Could not update quotation status:', error)
    }

    console.log(`✅ [UNIFIED-EMAIL-API] Quotation email sent successfully: ${quotationId}`)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      quotationId,
      email,
      language,
      isUpdated
    })

  } catch (error) {
    console.error('❌ [UNIFIED-EMAIL-API] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
