import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { EmailAPIWrapper } from '@/lib/services/email-api-wrapper'
import { PricingPackage, PricingPromotion } from '@/types/quotations'
import { emailTemplateService } from '@/lib/email/template-service'
import { Resend } from 'resend'
import { generateOptimizedPdfFromHtml } from '@/lib/optimized-html-pdf-generator'
import { generateInvoiceHtml } from '@/app/api/quotations/generate-invoice-pdf/route'

// =============================================================================
// MIGRATED INVOICE EMAIL API - Now uses unified notification templates
// =============================================================================
// This route has been migrated from hardcoded templates to the unified system.

export async function POST(request: NextRequest) {
  console.log('🔄 [MIGRATED-INVOICE-API] Processing invoice email request')
  
  try {
    const formData = await request.formData()
    const quotationId = formData.get('quotation_id') as string
    const email = formData.get('email') as string
    const language = (formData.get('language') as string) || 'en'
    const bccEmails = formData.get('bcc_emails') as string || 'booking@japandriver.com'

    if (!quotationId) {
      return NextResponse.json({ error: 'Quotation ID is required' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    console.log(`🔄 [UNIFIED-EMAIL-API] Processing quotation ${quotationId} for ${email}`)

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

    // Generate payment link for invoice (customer hasn't paid yet)
    let paymentLink: string | null = null
    try {
      const paymentLinkResponse = await fetch(`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/quotations/generate-omise-payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quotation_id: quotationId
        })
      })
      
      if (paymentLinkResponse.ok) {
        const paymentLinkData = await paymentLinkResponse.json()
        paymentLink = paymentLinkData.payment_link
        console.log('✅ [MIGRATED-INVOICE-API] Payment link generated:', paymentLink)
      } else {
        console.error('❌ [MIGRATED-INVOICE-API] Payment link generation failed:', await paymentLinkResponse.text())
      }
    } catch (error) {
      console.warn('⚠️ [MIGRATED-INVOICE-API] Could not generate payment link:', error)
    }

    // Generate magic link as well
    let magicLink: string | null = null
    try {
      const magicLinkResponse = await fetch(`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/quotations/create-magic-link`, {
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
        console.log('✅ [MIGRATED-INVOICE-API] Magic link generated:', magicLink)
      } else {
        console.error('❌ [MIGRATED-INVOICE-API] Magic link generation failed:', await magicLinkResponse.text())
      }
    } catch (error) {
      console.warn('⚠️ [MIGRATED-INVOICE-API] Could not generate magic link:', error)
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
      date: quotation.pickup_date,
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
      
      // Add missing fields
      expiry_date: quotation.expiry_date,
      service_name: quotation.service_type, // Template uses service_name
      
      // Package and promotion codes
      selected_package_code: quotation.selected_package_name,
      selected_promotion_code: quotation.selected_promotion_code,
      
      // Status and metadata
      status: quotation.status,
      created_at: quotation.created_at,
      updated_at: quotation.updated_at,
      last_sent_at: quotation.updated_at,
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
      
      // Location and timing
      pickup_location: quotation.pickup_location || quotation.customer_notes || 'Pick up location',
      dropoff_location: quotation.dropoff_location || quotation.merchant_notes || 'Drop off location', 
      date: quotation.pickup_date || 'TBD',
      time: quotation.pickup_time || 'TBD',
      
      // Financial information
      total_amount: quotation.total_amount || 0,
      amount: quotation.total_amount || 0,
      currency: quotation.currency || 'JPY',
      service_total: quotation.total_amount || 0,
      final_total: quotation.total_amount || 0,
      
      // Important dates
      expiry_date: quotation.expiry_date || '2025-10-15',
      created_at: quotation.created_at,
      updated_at: quotation.updated_at,
      
      // Status and metadata
      status: quotation.status,
      is_updated: isUpdated.toString(),
      magic_link: magicLink || '', // Ensure it's always a string
      
      // Payment information - Invoice requires payment
      payment_required: true, // Show payment section for invoice
      payment_link: paymentLink || '', // Payment link for customer to pay
      
      // Localization
      language,
      team_location: quotation.team_location || 'japan',
      
      // Invoice dates (issue and due dates)
      issue_date: new Date().toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US'),
      due_date: quotation.expiry_date 
        ? new Date(quotation.expiry_date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US')
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US'), // 7 days from now
      
      // Greeting message - Invoice specific (payment required)
      greeting_text: language === 'ja' 
        ? 'インボイスをお送りいたします。下記のリンクからお支払いをお願いいたします。'
        : 'Please find your invoice below. You can complete your payment using the link provided.'
    }

    console.log('🔄 [UNIFIED-EMAIL-API] Using direct template service')
    
    // Generate invoice PDF attachment using existing professional system
    console.log('🔄 [MIGRATED-INVOICE-API] Generating invoice PDF attachment using existing system')
    let pdfAttachment = null
    try {
      // Get customers and quotation_items for proper invoice generation (same as existing system)
      const supabaseForPdf = createServiceClient()
      const { data: quotationWithRelations, error: fetchError } = await supabaseForPdf
        .from('quotations')
        .select('*, customers (*), quotation_items (*)')
        .eq('id', quotationId)
        .single()

      if (fetchError || !quotationWithRelations) {
        throw new Error(`Failed to fetch quotation data: ${fetchError?.message}`)
      }

      // Use the EXISTING generateInvoiceHtml function - same as the professional system
      const htmlContent = generateInvoiceHtml(
        quotationWithRelations,
        language as 'en' | 'ja',
        selectedPackage,
        selectedPromotion
      )
      
      // Use the same PDF generation as the existing system
      const pdfBuffer = await generateOptimizedPdfFromHtml(htmlContent, {
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        printBackground: true
      }, quotationWithRelations, selectedPackage, selectedPromotion, language)
      
      pdfAttachment = {
        filename: `INV-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || quotation.id.slice(-6).toUpperCase()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
      console.log('✅ [MIGRATED-INVOICE-API] Professional invoice PDF attachment generated:', pdfAttachment.filename)
    } catch (error) {
      console.warn('⚠️ [MIGRATED-INVOICE-API] Could not generate professional invoice PDF attachment:', error)
      console.error('PDF generation error details:', error)
    }
    
    // Render the template using emailTemplateService directly - Use Invoice Email template
    const rendered = await emailTemplateService.renderTemplate(
      'Invoice Email',
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
      subject: language === 'ja' ? 'インボイス - お支払いをお願いいたします' : 'Invoice - Payment Required',
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

    // Update quotation status and last sent time
    const { error: updateError } = await supabase
      .from('quotations')
      .update({ 
        status: 'sent',
        last_sent_at: new Date().toISOString()
      })
      .eq('id', quotationId)

    if (updateError) {
      console.warn('⚠️ [UNIFIED-EMAIL-API] Could not update quotation status:', updateError)
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
