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

    // Run package, promotion, and magic link queries in parallel
    const [packageResult, promotionResult, magicLinkResult] = await Promise.allSettled([
      // Get selected package if exists
      quotation.selected_package_id ? supabase
        .from('pricing_packages')
        .select('*')
        .eq('id', quotation.selected_package_id)
        .single() : Promise.resolve({ data: null }),
      
      // Get selected promotion if exists  
      quotation.selected_promotion_id ? supabase
        .from('pricing_promotions')
        .select('*')
        .eq('id', quotation.selected_promotion_id)
        .single() : Promise.resolve({ data: null }),
      
      // Generate magic link
      (async () => {
        try {
          const host = request.headers.get('host') || '';
          let baseUrl;
          if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('3000')) {
            baseUrl = 'http://localhost:3000';
          } else if (host.includes('my.japandriver.com')) {
            baseUrl = 'https://my.japandriver.com';
          } else {
            baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://my.japandriver.com';
          }
          
          const magicLinkResponse = await fetch(`${baseUrl}/api/quotations/create-magic-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              quotation_id: quotationId, 
              customer_email: quotation.customer_email 
            })
          });
          
          if (magicLinkResponse.ok) {
            const magicLinkData = await magicLinkResponse.json();
            return magicLinkData.magic_link;
          }
          return null;
        } catch (error) {
          console.warn('⚠️ [UNIFIED-EMAIL-API] Could not generate magic link:', error);
          return null;
        }
      })()
    ]);

    // Extract results
    const selectedPackage = packageResult.status === 'fulfilled' ? packageResult.value.data as PricingPackage | null : null;
    const selectedPromotion = promotionResult.status === 'fulfilled' ? promotionResult.value.data as PricingPromotion | null : null;
    const magicLink = magicLinkResult.status === 'fulfilled' ? magicLinkResult.value : null;
    
    if (magicLink) {
      console.log('✅ [UNIFIED-EMAIL-API] Magic link generated:', magicLink);
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
        // For Airport Transfer services, show "Fixed rates"
        if (quotation.service_type?.toLowerCase().includes('airport')) {
          return language === 'ja' ? '（固定料金）' : '（Fixed rates）';
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
      
      // Package and promotion details
      selected_package: selectedPackage,
      selected_promotion: selectedPromotion,
      selected_promotion_name: selectedPromotion?.name || quotation.selected_promotion_name || '',
      
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
      
      // Email header structure (like booking emails)
      subtitle: quotation.team_location === 'thailand' ? 'Driver Thailand' : 'Driver Japan',
      email_title: 'Your Quotation',
      
      // Greeting message
      greeting_text: isUpdated 
        ? 'Thank you for your interest in our services. Please find your updated quotation below.'
        : 'Thank you for your interest in our services. Please find your quotation below.',
      
      // Add quotation_items array for template loops
      quotation_items: quotation.quotation_items || []
    } as any

    // Add service_type_charter field to each quotation item for template labels
    if (templateVariables.quotation_items && Array.isArray(templateVariables.quotation_items)) {
      templateVariables.quotation_items = templateVariables.quotation_items.map((item: any) => {
        const isCharter = item.service_type_name?.toLowerCase().includes('charter') || false
        const isAirport = item.service_type_name?.toLowerCase().includes('airport') || false
        console.log('🔍 [UNIFIED-EMAIL-API] Processing item:', {
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
              
              console.log('🔍 [UNIFIED-EMAIL-API] Generating time adjustment HTML for Airport service:', {
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
            console.log('🔍 [UNIFIED-EMAIL-API] No time adjustment for service:', {
              service_type_name: item.service_type_name,
              isAirport,
              isCharter,
              time_based_adjustment: item.time_based_adjustment
            });
            
            return '';
          })()
        }
      })
      console.log('🔍 [UNIFIED-EMAIL-API] Final quotation_items:', templateVariables.quotation_items)
    }

    // Debug: Log the service_days_display value
    console.log('🔍 [UNIFIED-EMAIL-API] service_days_display value:', templateVariables.service_days_display);
    console.log('🔍 [UNIFIED-EMAIL-API] service_type:', quotation.service_type);

    console.log('🔄 [UNIFIED-EMAIL-API] Using direct template service')
    
    // Run PDF generation and template rendering in parallel
    console.log('🔄 [UNIFIED-EMAIL-API] Generating PDF and rendering template in parallel')
    const [pdfResult, templateResult] = await Promise.allSettled([
      // Generate quotation PDF attachment
      (async () => {
        try {
          const pdfBuffer = await generateOptimizedQuotationPDF(
            quotation,
            language,
            selectedPackage,
            selectedPromotion
          )
          
          return {
            filename: `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || quotation.id.slice(-6).toUpperCase()}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        } catch (error) {
          console.warn('⚠️ [UNIFIED-EMAIL-API] Could not generate PDF attachment:', error)
          return null
        }
      })(),
      
      // Render the template using emailTemplateService directly
      emailTemplateService.renderTemplate(
        'Quotation Sent',
        templateVariables,
        'japan',
        language as 'en' | 'ja'
      )
    ])

    // Extract results
    const pdfAttachment = pdfResult.status === 'fulfilled' ? pdfResult.value : null
    const rendered = templateResult.status === 'fulfilled' ? templateResult.value : null

    if (pdfAttachment) {
      console.log('✅ [UNIFIED-EMAIL-API] PDF attachment generated:', pdfAttachment.filename)
    }

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
