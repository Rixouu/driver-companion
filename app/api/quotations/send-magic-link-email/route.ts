import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { EmailAPIWrapper } from '@/lib/services/email-api-wrapper'
import { PricingPackage, PricingPromotion } from '@/types/quotations'
import { emailTemplateService } from '@/lib/email/template-service'
import { Resend } from 'resend'

// =============================================================================
// MIGRATED MAGIC LINK EMAIL API - Now uses unified notification templates
// =============================================================================
// This route has been migrated from hardcoded templates to the unified system.

export async function POST(request: NextRequest) {
  console.log('🔄 [MIGRATED-MAGIC-LINK-API] Processing magic link email request')
  
  try {
    // Handle both FormData and JSON input for flexibility
    let quotationId: string
    let email: string 
    let language: string
    let bccEmails: string

    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const body = await request.json()
      quotationId = body.quotation_id
      email = body.customer_email || body.email
      language = body.language || 'en'
      bccEmails = body.bcc_emails || 'admin.rixou@gmail.com'
    } else {
      const formData = await request.formData()
      quotationId = formData.get('quotation_id') as string
      email = formData.get('email') as string
      language = (formData.get('language') as string) || 'en'
      bccEmails = formData.get('bcc_emails') as string || 'admin.rixou@gmail.com'
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
    
    // Process quotation_items for comprehensive template variables
    const processedQuotationItems = (quotation.quotation_items || []).map((item: any) => {
      // Determine service type flags
      const isCharter = item.service_type?.toLowerCase().includes('charter') || false
      const isAirport = item.service_type?.toLowerCase().includes('airport') || false
      
      // Calculate time-based pricing for Airport services
      let timeBasedDiscount = 0
      let timeBasedDiscountPercentage = 0
      let timeBasedRuleName = ''
      
      if (isAirport && item.duration_hours) {
        // Apply time-based pricing logic (same as send-email route)
        if (item.duration_hours > 8) {
          timeBasedDiscountPercentage = 15
          timeBasedDiscount = item.unit_price * 0.15
          timeBasedRuleName = 'Extended Hours Discount (15%)'
        } else if (item.duration_hours > 4) {
          timeBasedDiscountPercentage = 10
          timeBasedDiscount = item.unit_price * 0.10
          timeBasedRuleName = 'Extended Hours Discount (10%)'
        }
      }
      
      return {
        ...item,
        // Service type flags
        service_type_charter: isCharter,
        service_type_airport: isAirport,
        service_type_name: item.service_type || 'Transportation Service',
        
        // Time-based pricing
        time_based_discount: timeBasedDiscount,
        time_based_discount_percentage: timeBasedDiscountPercentage,
        time_based_rule_name: timeBasedRuleName,
        
        // Short description for display
        short_description: item.description || `${item.service_type} Service`,
        
        // Ensure proper formatting
        unit_price: item.unit_price || 0,
        total_price: item.total_price || 0,
        quantity: item.quantity || 1,
        service_days: item.service_days || 1,
        duration_hours: item.duration_hours || 0,
        pickup_date: item.pickup_date || quotation.pickup_date,
        pickup_time: item.pickup_time || quotation.pickup_time,
        pickup_location: item.pickup_location || quotation.pickup_location,
        dropoff_location: item.dropoff_location || quotation.dropoff_location,
        number_of_passengers: item.number_of_passengers || (quotation as any).number_of_passengers,
        number_of_bags: item.number_of_bags || (quotation as any).number_of_bags,
        flight_number: item.flight_number || (quotation as any).flight_number,
        terminal: item.terminal || (quotation as any).terminal
      }
    })
    
    // Calculate total time-based discount from all items
    let totalTimeBasedDiscount = 0
    let totalTimeBasedDiscountPercentage = 0
    let timeBasedRuleName = ''
    
    processedQuotationItems.forEach((item: any) => {
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
      service_type_airport: (quotation.service_type?.toLowerCase().includes('airport') || false) ? 'true' : 'false',
      
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
      subtotal: quotation.total_amount || 0,
      final_total: quotation.total_amount || 0,
      
      // Time-based pricing (calculated from quotation_items)
      time_based_discount: totalTimeBasedDiscount,
      time_based_discount_percentage: totalTimeBasedDiscountPercentage,
      time_based_rule_name: timeBasedRuleName,
      
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
      selected_promotion_name: selectedPromotion?.name,
      
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
      
      // Quotation items for template looping
      quotation_items: processedQuotationItems,
      
      // Localization
      language,
      team_location: quotation.team_location || 'japan',
      
      // Email header structure (like booking emails)
      subtitle: quotation.team_location === 'thailand' ? 'Driver Thailand' : 'Driver Japan',
      email_title: 'Your Quotation Access',
      
      // Greeting message - Magic link specific
      greeting_text: language === 'ja' 
        ? 'あなたの見積書へのセキュアなアクセスリンクです。'
        : 'Here is your secure access link to view your quotation.'
    }

    console.log('🔄 [UNIFIED-EMAIL-API] Using direct template service')
    
    // Render the template using emailTemplateService directly
    const rendered = await emailTemplateService.renderTemplate(
      'Quotation Sent',
      templateVariables as any,
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
      subject: language === 'ja' ? '見積書へのセキュアアクセス' : 'Secure Access to Your Quotation',
      html: rendered.html,
      text: rendered.text
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
