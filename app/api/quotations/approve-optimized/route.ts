import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { Resend } from 'resend'
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator'
import { emailTemplateService } from '@/lib/email/template-service'
import { EmailVariableMapper } from '@/lib/services/email-variable-mapper'

// =============================================================================
// QUOTATION APPROVAL API - Proper Implementation
// =============================================================================

export async function POST(request: NextRequest) {
  console.log('🚀 [APPROVE-API] Starting quotation approval process')
  
  try {
    // Handle both JSON and FormData requests
    let quotationId: string
    let notes: string
    let signature: string
    let bccEmails: string

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // Handle JSON request
      const body = await request.json()
      quotationId = body.id || body.quotation_id
      notes = body.notes || ''
      signature = body.signature || ''
      bccEmails = body.bcc_emails || 'booking@japandriver.com'
    } else {
      // Handle FormData request
      const formData = await request.formData()
      quotationId = formData.get('quotation_id') as string
      notes = formData.get('notes') as string || ''
      signature = formData.get('signature') as string || ''
      bccEmails = formData.get('bcc_emails') as string || 'booking@japandriver.com'
    }

    if (!quotationId) {
      return NextResponse.json({ error: 'Quotation ID is required' }, { status: 400 })
    }

    console.log(`🔄 [APPROVE-API] Processing quotation ${quotationId}`)

    const supabase = createServiceClient()

    // Get quotation data with relations
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select(`
        *,
        customers (
          name,
          email
        ),
        quotation_items (*)
      `)
      .eq('id', quotationId)
      .single()

    if (quotationError || !quotation) {
      console.error('❌ [APPROVE-API] Quotation not found:', quotationError)
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    console.log('✅ [APPROVE-API] Quotation found:', quotation.id)

    // Update quotation status to approved with signature and notes
    console.log('🔄 [APPROVE-API] Updating quotation status to approved...')
    const { data: updateData, error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approval_notes: notes || null,
        approval_signature: signature || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', quotationId)
      .select()

    if (updateError) {
      console.error('❌ [APPROVE-API] Error updating quotation:', updateError)
      return NextResponse.json({ error: 'Failed to approve quotation' }, { status: 500 })
    }

    console.log('✅ [APPROVE-API] Quotation status updated to approved:', updateData)

    // Record the approval activity
    console.log('🔄 [APPROVE-API] Recording approval activity...')
    const { error: activityError } = await supabase
      .from('quotation_activities')
      .insert({
        quotation_id: quotationId,
        action: 'approved',
        details: {
          description: notes || 'Quotation approved',
          signature: signature || null,
          approved_via: 'admin_panel'
        },
        created_at: new Date().toISOString()
      })

    if (activityError) {
      console.warn('⚠️ [APPROVE-API] Failed to record activity:', activityError)
    } else {
      console.log('✅ [APPROVE-API] Activity recorded successfully')
    }

    // Get updated quotation with signature for PDF generation
    const { data: updatedQuotation } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (*)
      `)
      .eq('id', quotationId)
      .single()

    // Fetch associated package and promotion for PDF generation
    let selectedPackage = null
    const packageId = quotation.selected_package_id || (quotation as any).package_id || (quotation as any).pricing_package_id
    if (packageId) {
      const { data: pkg } = await supabase
        .from('pricing_packages')
        .select('*, items:pricing_package_items(*)')
        .eq('id', packageId)
        .single()
      selectedPackage = pkg
    }

    let selectedPromotion = null
    const promotionCode = quotation.selected_promotion_code || (quotation as any).promotion_code
    if (promotionCode) {
      const { data: promo } = await supabase
        .from('pricing_promotions')
        .select('*')
        .eq('code', promotionCode)
        .single()
      selectedPromotion = promo
    }

    // Generate PDF with signature
    let pdfAttachment = null
    try {
      console.log('🔄 [APPROVE-API] Generating PDF with signature...')
      
      const pdfBuffer = await generateOptimizedQuotationPDF(
        updatedQuotation || quotation,
        'en',
        selectedPackage,
        selectedPromotion
      )
      
      pdfAttachment = {
        filename: `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || quotation.id.slice(-6).toUpperCase()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
      
      console.log('✅ [APPROVE-API] PDF generated with signature:', pdfAttachment.filename)
    } catch (error) {
      console.warn('⚠️ [APPROVE-API] PDF generation failed:', error)
    }

    // Send approval email using unified template system
    const resend = new Resend(process.env.RESEND_API_KEY)
    const customerEmail = quotation.customer_email || quotation.customers?.email

    if (!customerEmail) {
      console.warn('⚠️ [APPROVE-API] No customer email found')
      return NextResponse.json({ 
        success: true, 
        message: 'Quotation approved but no email sent (no customer email)' 
      })
    }

    console.log('🔄 [APPROVE-API] Preparing template variables for approval email')


    // Complete template variables with all required data (same as unified route)
    const templateVariables = {
      // Basic identifiers
      customer_name: quotation.customer_name || 'Valued Customer',
      customer_email: quotation.customer_email || quotation.customers?.email || 'customer@example.com',
      quotation_id: `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || quotation.id.slice(-6).toUpperCase()}`,
      quotation_number: quotation.quote_number,
      
      // Service details
      service_type: quotation.service_type || 'Service',
      service_name: quotation.service_type || 'Service',
      vehicle_type: quotation.vehicle_type || 'Vehicle',
      duration_hours: quotation.duration_hours || 1,
      service_days: quotation.service_days || 1,
      hours_per_day: quotation.hours_per_day || 1,
      service_days_display: (quotation.service_days || 1) > 1 ? `(${quotation.service_days} days)` : '',
      
      // Location details
      pickup_location: quotation.pickup_location || 'Pick up location',
      dropoff_location: quotation.dropoff_location || 'Drop off location',
      date: quotation.pickup_date || 'TBD',
      time: quotation.pickup_time || 'TBD',
      pickup_date: quotation.pickup_date || 'TBD',
      pickup_time: quotation.pickup_time || 'TBD',
      
      // Pricing details
      currency: quotation.currency || 'JPY',
      display_currency: quotation.currency || 'JPY',
      total_amount: quotation.total_amount || 0,
      service_total: quotation.total_amount || 0,
      subtotal: quotation.total_amount || 0,
      tax_amount: 0,
      tax_percentage: 0,
      discount_percentage: 0,
      regular_discount: 0,
      promotion_discount: 0,
      promo_code_discount: 0,
      refund_amount: 0,
      final_total: quotation.total_amount || 0,
      
      // Package and promotion
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
      
      // Status and metadata
      status: 'approved',
      is_updated: false,
      magic_link: null,
      
      // Dates
      created_at: quotation.created_at,
      updated_at: quotation.updated_at,
      last_sent_at: quotation.last_sent_at,
      
      // Team info
      team_location: quotation.team_location || 'japan',
      
      // Greeting message
      greeting_text: 'Great news! Your quotation has been approved and is ready for the next steps.',
      
      // Add quotation_items array for template loops
      quotation_items: quotation.quotation_items || [],
      
      // Additional properties for template compatibility
      subject: '',
      approval_notes: '',
      approval_signature: '',
      approval_date: ''
    } as any

    // Add service_type_charter field to each quotation item for template labels (same as unified route)
    if (templateVariables.quotation_items && Array.isArray(templateVariables.quotation_items)) {
      templateVariables.quotation_items = templateVariables.quotation_items.map((item: any) => {
        const isCharter = item.service_type_name?.toLowerCase().includes('charter') || false
        const isAirport = item.service_type_name?.toLowerCase().includes('airport') || false
        console.log('🔍 [APPROVE-API] Processing item:', {
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
              const timeLabel = 'Time Adjustment';
              
              console.log('🔍 [APPROVE-API] Generating time adjustment HTML for Airport service:', {
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
            console.log('🔍 [APPROVE-API] No time adjustment for service:', {
              service_type_name: item.service_type_name,
              isAirport,
              isCharter,
              time_based_adjustment: item.time_based_adjustment
            });
            
            return '';
          })()
        }
      })
      console.log('🔍 [APPROVE-API] Final quotation_items:', templateVariables.quotation_items)
    }

    // Override specific variables for approval email
    templateVariables.greeting_text = 'Great news! Your quotation has been approved and is ready for the next steps.'
    templateVariables.subject = `Your Quotation has been Approved - #QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || quotation.id.slice(-6).toUpperCase()}`
    
    // Add approval-specific variables
    templateVariables.approval_notes = notes || ''
    templateVariables.approval_signature = signature || ''
    templateVariables.approval_date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    console.log('🔄 [APPROVE-API] Rendering approval email template')

    // Render the template using emailTemplateService
    const rendered = await emailTemplateService.renderTemplate(
      'Quotation Approved',
      templateVariables,
      'japan',
      'en'
    )

    if (!rendered) {
      console.error('❌ [APPROVE-API] Template rendering failed')
      return NextResponse.json({ error: 'Failed to render email template' }, { status: 500 })
    }

    console.log('✅ [APPROVE-API] Template rendered successfully')

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Driver Japan <booking@japandriver.com>',
      to: [customerEmail],
      bcc: [bccEmails],
      subject: templateVariables.subject,
      html: rendered.html,
      text: rendered.text,
      attachments: pdfAttachment ? [pdfAttachment] : []
    })

    if (emailError) {
      console.error('❌ [APPROVE-API] Email sending failed:', emailError)
      return NextResponse.json({ 
        success: true, 
        message: 'Quotation approved but email failed to send',
        error: emailError.message 
      })
    }

    console.log('✅ [APPROVE-API] Approval email sent successfully:', emailData?.id)

    return NextResponse.json({
      success: true,
      message: 'Quotation approved and email sent successfully',
      quotation_id: quotationId,
      email_id: emailData?.id
    })

  } catch (error) {
    console.error('❌ [APPROVE-API] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}