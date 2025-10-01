import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { EmailAPIWrapper } from '@/lib/services/email-api-wrapper'
import { PricingPackage, PricingPromotion } from '@/types/quotations'
import { emailTemplateService } from '@/lib/email/template-service'
import { Resend } from 'resend'
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator'

// =============================================================================
// MIGRATED QUOTATION REJECT API - Now uses unified notification templates
// =============================================================================
// This route has been migrated from hardcoded templates to the unified system.

export async function POST(request: NextRequest) {
  console.log('🔄 [MIGRATED-REJECT-API] Processing quotation rejection email request')
  
  try {
    // Handle both JSON and FormData requests
    let quotationId: string
    let email: string
    let language: string
    let bccEmails: string
    let reason: string
    let signature: string | null = null

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // Handle JSON request
      const body = await request.json()
      quotationId = body.id || body.quotation_id
      email = body.email
      language = body.language || 'en'
      bccEmails = body.bcc_emails || 'booking@japandriver.com'
      reason = body.reason || body.rejected_reason || ''
      signature = body.signature || null
    } else {
      // Handle FormData request
      const formData = await request.formData()
      quotationId = formData.get('quotation_id') as string
      email = formData.get('email') as string
      language = (formData.get('language') as string) || 'en'
      bccEmails = formData.get('bcc_emails') as string || 'booking@japandriver.com'
      reason = formData.get('reason') as string || ''
      signature = formData.get('signature') as string || null
    }

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

    // Update quotation status to rejected
    const { error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || 'No reason provided',
        rejection_signature: signature,
        updated_at: new Date().toISOString()
      })
      .eq('id', quotationId)

    if (updateError) {
      console.error('❌ [UNIFIED-EMAIL-API] Error updating quotation status:', updateError)
      return NextResponse.json({ error: 'Failed to update quotation status' }, { status: 500 })
    }

    console.log('✅ [UNIFIED-EMAIL-API] Quotation status updated to rejected')

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

    // No magic link needed for rejection
    const magicLink: string | null = null

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
      
      // Override subject for rejection
      subject: 'Your Quotation has been Rejected',
      
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
      requested_date: quotation.pickup_date || 'TBD',
      
      // Financial information
      total_amount: quotation.total_amount || 0,
      amount: quotation.amount || quotation.total_amount || 0,
      currency: quotation.currency || 'JPY',
      service_total: quotation.amount || quotation.total_amount || 0,
      final_total: quotation.total_amount || 0,
      
      // Pricing breakdown
      subtotal: quotation.amount || quotation.total_amount || 0,
      tax_amount: quotation.total_amount * ((quotation.tax_percentage || 0) / 100),
      tax_percentage: quotation.tax_percentage || 0,
      discount_percentage: quotation.discount_percentage || 0,
      regular_discount: quotation.amount * ((quotation.discount_percentage || 0) / 100),
      promotion_discount: quotation.promotion_discount || 0,
      time_based_discount: (quotation as any).time_based_discount || 0,
      promo_code_discount: (quotation as any).promo_code_discount || 0,
      promo_code: (quotation as any).promo_code || '',
      refund_amount: (quotation as any).refund_amount || 0,
      
      // Important dates
      expiry_date: quotation.expiry_date || '2025-10-15',
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
        : 'Thank you for your interest in our services. Please find your quotation below.',
      
      // Add quotation_items array for template loops
      quotation_items: quotation.quotation_items || [],
      
      // Rejection-specific variables
      rejection_reason: reason || '',
      contact_email: 'booking@japandriver.com',
      website_url: 'https://japandriver.com',
      
      // Signature information for PDF
      rejection_signature: 'Driver Japan Team',
      rejection_date: new Date().toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US'),
      
      // Package and promotion details
      selected_package: selectedPackage,
      selected_promotion: selectedPromotion,
      selected_promotion_name: selectedPromotion?.name || quotation.selected_promotion_name || ''
    } as any

    // Add service_type_charter field to each quotation item for template labels (same as unified route)
    if (templateVariables.quotation_items && Array.isArray(templateVariables.quotation_items)) {
      templateVariables.quotation_items = templateVariables.quotation_items.map((item: any) => {
        const isCharter = item.service_type_name?.toLowerCase().includes('charter') || false
        const isAirport = item.service_type_name?.toLowerCase().includes('airport') || false
        console.log('🔍 [REJECT-API] Processing item:', {
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
              
              console.log('🔍 [REJECT-API] Generating time adjustment HTML for Airport service:', {
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
            console.log('🔍 [REJECT-API] No time adjustment for service:', {
              service_type_name: item.service_type_name,
              isAirport,
              isCharter,
              time_based_adjustment: item.time_based_adjustment
            });
            
            return '';
          })()
        }
      })
      console.log('🔍 [REJECT-API] Final quotation_items:', templateVariables.quotation_items)
    }

    console.log('🔄 [UNIFIED-EMAIL-API] Using direct template service')
    
    // Generate quotation PDF attachment with rejection label
    console.log('🔄 [REJECT-API] Generating rejected quotation PDF attachment')
    let pdfAttachment = null
    try {
      // Create a modified quotation object with rejection information
      const rejectedQuotation = {
        ...quotation,
        status: 'rejected',
        rejection_reason: reason || 'No reason provided',
        rejected_at: new Date().toISOString(),
        // Add rejection label for PDF
        pdf_label: language === 'ja' ? '見積書却下' : 'QUOTATION REJECTED',
        pdf_status_color: '#dc2626', // Red color for rejected
        // Add signature information for PDF
        rejection_signature: signature || 'Driver Japan Team',
        rejection_date: new Date().toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US'),
        // Add signature for PDF footer
        signature: signature || 'Driver Japan Team',
        signature_date: new Date().toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US')
      }
      
      // Get template configuration for PDF generation
      const { data: templateData } = await supabase
        .from('pdf_templates' as any)
        .select('template_data, styling')
        .eq('type', 'quotation')
        .eq('is_active', true)
        .single()

      const templateConfig = (templateData as any)?.template_data || {
        showTeamInfo: true,
        showLanguageToggle: true,
        statusConfigs: {
          rejected: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#EF4444', statusBadgeName: 'REJECTED' }
        }
      }

      const pdfBuffer = await generateOptimizedQuotationPDF(
        rejectedQuotation,
        language,
        selectedPackage,
        selectedPromotion,
        templateConfig.showTeamInfo,
        templateConfig.statusConfigs
      )
      
      pdfAttachment = {
        filename: `REJECTED-QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || quotation.id.slice(-6).toUpperCase()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
      console.log('✅ [REJECT-API] Rejected PDF attachment generated:', pdfAttachment.filename)
    } catch (error) {
      console.warn('⚠️ [REJECT-API] Could not generate PDF attachment:', error)
    }
    
    // Render the template using emailTemplateService directly
    const rendered = await emailTemplateService.renderTemplate(
      'Quotation Rejected',
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
    console.log(`✅ [UNIFIED-EMAIL-API] Quotation rejection email sent successfully: ${quotationId}`)

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
