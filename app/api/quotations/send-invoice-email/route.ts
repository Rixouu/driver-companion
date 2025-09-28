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

    // Get quotation data with quotation_items
    const supabase = createServiceClient()
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('*, quotation_items (*)')
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
      invoice_id: `INV-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || quotation.id.slice(-6).toUpperCase()}`,
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
      subtotal: (quotation as any).subtotal || (quotation as any).service_total || quotation.total_amount || 0,
      tax_amount: (quotation as any).tax_amount || 0,
      tax_percentage: (quotation as any).tax_percentage || 0,
      discount_percentage: (quotation as any).discount_percentage || 0,
      regular_discount: (quotation as any).regular_discount || 0,
      promotion_discount: (quotation as any).promotion_discount || 0,
      promo_code_discount: (quotation as any).promo_code_discount || 0,
      refund_amount: (quotation as any).refund_amount || 0,
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
      
      // Email header structure (like booking emails)
      subtitle: quotation.team_location === 'thailand' ? 'Driver Thailand' : 'Driver Japan',
      email_title: 'Invoice - Payment Required',
      
      // Invoice dates (issue and due dates)
      issue_date: new Date().toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US'),
      due_date: quotation.expiry_date 
        ? new Date(quotation.expiry_date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US')
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US'), // 7 days from now
      
      // Greeting message - Invoice specific (payment required)
      greeting_text: language === 'ja' 
        ? 'インボイスをお送りいたします。下記のリンクからお支払いをお願いいたします。'
        : 'Please find your invoice below. You can complete your payment using the link provided.',
      
      // Add quotation_items array for template loops
      quotation_items: quotation.quotation_items || [],
      
      // Time-based pricing (calculated from quotation_items)
      time_based_discount: 0,
      time_based_discount_percentage: 0,
      time_based_rule_name: '',
      
      // Package and promotion information
      selected_package: selectedPackage ? {
        name: selectedPackage.name,
        base_price: selectedPackage.base_price,
        description: selectedPackage.description
      } : null,
      selected_promotion: selectedPromotion ? {
        name: selectedPromotion.name,
        discount_percentage: (selectedPromotion as any).discount_percentage || 0,
        description: selectedPromotion.description
      } : null,
      selected_package_name: selectedPackage?.name,
      selected_promotion_name: selectedPromotion?.name
    } as any

    // Add service_type_charter field to each quotation item for template labels (same as unified route)
    if (templateVariables.quotation_items && Array.isArray(templateVariables.quotation_items)) {
      templateVariables.quotation_items = templateVariables.quotation_items.map((item: any) => {
        const isCharter = item.service_type_name?.toLowerCase().includes('charter') || false
        const isAirport = item.service_type_name?.toLowerCase().includes('airport') || false
        console.log('🔍 [INVOICE-API] Processing item:', {
          service_type_name: item.service_type_name,
          isCharter: isCharter,
          isAirport: isAirport,
          pickup_location: item.pickup_location,
          number_of_passengers: item.number_of_passengers,
          time_based_adjustment: item.time_based_adjustment,
          time_based_rule_name: item.time_based_rule_name
        })
        return {
          ...item,
          service_type_charter: isCharter,
          service_type_airport: isAirport,
          // String flags for template engine compatibility
          show_time_pricing: isAirport ? 'yes' : 'no',
          // Only show time pricing if it's airport AND has actual discount
          show_time_adjustment: (isAirport && item.time_based_adjustment && item.time_based_adjustment > 0) ? 'yes' : 'no',
          // Shorten service names for display
          short_description: (() => {
            if (isCharter) return 'Charter Services'
            if (isAirport) return 'Airport Transfer Narita'
            return item.description || item.service_type_name || 'Service'
          })(),
          // Ensure all required fields are present for template conditions
          pickup_location: item.pickup_location || '',
          dropoff_location: item.dropoff_location || '',
          number_of_passengers: item.number_of_passengers || 0,
          number_of_bags: item.number_of_bags || 0,
          service_days: item.service_days || 1,
          duration_hours: item.duration_hours || 1,
          hours_per_day: item.hours_per_day || 1,
          pickup_date: item.pickup_date || '',
          pickup_time: item.pickup_time || '',
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          // Time-based pricing data - ONLY for Airport services (Charter Services get null)
          time_based_discount: isCharter ? null : (isAirport && item.time_based_adjustment ? (item.unit_price * item.time_based_adjustment / 100) : null),
          time_based_discount_percentage: isCharter ? null : (isAirport && item.time_based_adjustment ? item.time_based_adjustment : null),
          time_based_rule_name: isCharter ? null : (isAirport && item.time_based_rule_name ? item.time_based_rule_name : null),
          time_based_rules: item.time_based_rules || [],
          // Pre-computed display flags to avoid template condition issues
          show_time_adjustment_flag: (isAirport && item.time_based_adjustment && item.time_based_adjustment > 0) ? 'yes' : 'no',
          
          // DEBUG: Log the final values being sent to template
          debug_time_values: {
            service_type_name: item.service_type_name,
            isCharter: isCharter,
            isAirport: isAirport,
            time_based_discount: isCharter ? null : (isAirport && item.time_based_adjustment ? (item.unit_price * item.time_based_adjustment / 100) : null),
            time_based_discount_percentage: isCharter ? null : (isAirport && item.time_based_adjustment ? item.time_based_adjustment : null),
            time_based_rule_name: isCharter ? null : (isAirport && item.time_based_rule_name ? item.time_based_rule_name : null),
            show_time_adjustment: (isAirport && item.time_based_adjustment && item.time_based_adjustment > 0) ? 'yes' : 'no'
          },
          // Simplified pre-computed values for template
          time_adjustment_percentage: isAirport && item.time_based_adjustment ? item.time_based_adjustment : 0,
          time_adjustment_amount: isAirport && item.time_based_adjustment ? (item.unit_price * item.time_based_adjustment / 100) : 0,
          time_adjustment_rule_name: isAirport && item.time_based_rule_name ? item.time_based_rule_name : null,
          // Pre-generated HTML for time adjustment - ONLY for Airport services
          time_adjustment_html: (() => {
            // Only show time adjustment for Airport services (Haneda, Narita, etc.)
            if (isAirport && item.time_based_adjustment && item.time_based_adjustment > 0) {
              const amount = item.unit_price * item.time_based_adjustment / 100;
              const percentage = item.time_based_adjustment;
              const ruleName = item.time_based_rule_name;
              const timeLabel = language === 'ja' ? '時間調整' : 'Time Adjustment';
              
              console.log('🔍 [INVOICE-API] Generating time adjustment HTML for Airport service:', {
                service_type_name: item.service_type_name,
                isAirport,
                time_based_adjustment: item.time_based_adjustment,
                unit_price: item.unit_price,
                amount,
                percentage,
                ruleName
              });
              
              return `
                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
                  <div style="color: #f97316; font-weight: 600; margin-bottom: 2px;">${timeLabel} (${percentage}%): +¥${Math.round(amount).toLocaleString()}</div>
                  ${ruleName ? `<div style="color: #6b7280; font-size: 10px;">${ruleName}</div>` : ''}
                </div>
              `;
            }
            
            // For Charter Services, return empty string (no time adjustment)
            console.log('🔍 [INVOICE-API] No time adjustment for service:', {
              service_type_name: item.service_type_name,
              isAirport,
              isCharter,
              time_based_adjustment: item.time_based_adjustment
            });
            
            return '';
          })()
        }
      })
      console.log('🔍 [INVOICE-API] Final quotation_items:', templateVariables.quotation_items)
      
      // Calculate total time-based discount from all items
      let totalTimeBasedDiscount = 0
      let totalTimeBasedDiscountPercentage = 0
      let timeBasedRuleName = ''
      
      templateVariables.quotation_items.forEach((item: any) => {
        if (item.service_type_airport && item.time_based_discount && item.time_based_discount > 0) {
          totalTimeBasedDiscount += item.time_based_discount
          if (item.time_based_discount_percentage > totalTimeBasedDiscountPercentage) {
            totalTimeBasedDiscountPercentage = item.time_based_discount_percentage
          }
          if (item.time_based_rule_name && !timeBasedRuleName) {
            timeBasedRuleName = item.time_based_rule_name
          }
        }
      })
      
      // Update template variables with calculated time-based values
      templateVariables.time_based_discount = totalTimeBasedDiscount
      templateVariables.time_based_discount_percentage = totalTimeBasedDiscountPercentage
      templateVariables.time_based_rule_name = timeBasedRuleName
      
      // Calculate proper subtotal from quotation_items
      let calculatedSubtotal = 0
      templateVariables.quotation_items.forEach((item: any) => {
        if (item.total_price) {
          calculatedSubtotal += item.total_price
        }
      })
      
      // Update subtotal with calculated value
      if (calculatedSubtotal > 0) {
        templateVariables.subtotal = calculatedSubtotal
        templateVariables.service_total = calculatedSubtotal
      }
      
      console.log('🔍 [INVOICE-API] Calculated time-based values:', {
        time_based_discount: totalTimeBasedDiscount,
        time_based_discount_percentage: totalTimeBasedDiscountPercentage,
        time_based_rule_name: timeBasedRuleName
      })
      
      console.log('🔍 [INVOICE-API] Calculated subtotal:', {
        calculatedSubtotal,
        originalSubtotal: templateVariables.subtotal,
        finalSubtotal: templateVariables.subtotal
      })
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
