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
        description: notes || 'Quotation approved',
        metadata: {
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

    // Transform database quotation data to match EmailVariableMapper interface
    const transformedQuotation = {
      ...updatedQuotation || quotation,
      
      // Fix field name mismatches
      pickup_location: quotation.pickup_location || `${quotation.customer_notes || 'Pick up location'}`,
      dropoff_location: quotation.dropoff_location || `${quotation.merchant_notes || 'Drop off location'}`,
      date: quotation.pickup_date || 'TBD',
      time: quotation.pickup_time || 'TBD',
      
      // Fix currency and pricing fields
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
      final_total: quotation.total_amount || 0,
      
      // Fix service details
      service_type: quotation.service_type || 'Service',
      vehicle_type: quotation.vehicle_type || 'Vehicle',
      duration_hours: quotation.duration_hours || 1,
      service_days: quotation.service_days || 1,
      hours_per_day: quotation.hours_per_day || 1,
      
      // Customer info
      customer_name: quotation.customer_name || 'Customer',
      customer_email: quotation.customer_email || quotation.customers?.email || 'customer@example.com',
      
      // Status and metadata
      status: quotation.status || 'draft',
      created_at: quotation.created_at || new Date().toISOString(),
      updated_at: quotation.updated_at || new Date().toISOString(),
      last_sent_at: (quotation as any).last_sent_at || undefined,
      team_location: quotation.team_location || 'japan',
      
      // Package and promotion codes
      selected_package_code: quotation.selected_package_id || undefined,
      selected_promotion_code: quotation.selected_promotion_code || undefined
    }

    // Prepare template variables using the proper mapper
    const templateVariables = EmailVariableMapper.mapQuotationVariables(
      transformedQuotation,
      selectedPackage as any,
      selectedPromotion as any,
      null, // magicLink
      false // isUpdated
    )

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