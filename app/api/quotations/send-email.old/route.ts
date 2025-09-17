import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { EmailAPIWrapper } from '@/lib/services/email-api-wrapper'
import { PricingPackage, PricingPromotion } from '@/types/pricing'

// =============================================================================
// MIGRATED QUOTATION EMAIL API - Now uses unified notification templates
// =============================================================================
// This route has been migrated to use the unified email system with database templates.
// It now uses the same logic as the unified endpoint for better maintainability.

export async function POST(request: NextRequest) {
  console.log('🔄 [MIGRATED-SEND-EMAIL API] Using unified email system')
  
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

    console.log(`🔄 [MIGRATED-SEND-EMAIL API] Processing quotation ${quotationId} for ${email}`)

    // Get quotation data
    const supabase = createServiceClient()
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single()

    if (quotationError || !quotation) {
      console.error('❌ [MIGRATED-SEND-EMAIL API] Quotation not found:', quotationError)
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    // Get selected package if exists
    let selectedPackage: PricingPackage | null = null
    if (quotation.selected_package_code) {
      const { data: packageData } = await supabase
        .from('pricing_packages')
        .select('*')
        .eq('code', quotation.selected_package_code)
        .single()
      selectedPackage = packageData as PricingPackage | null
    }

    // Get selected promotion if exists
    let selectedPromotion: PricingPromotion | null = null
    if (quotation.selected_promotion_code) {
      const { data: promotionData } = await supabase
        .from('pricing_promotions')
        .select('*')
        .eq('code', quotation.selected_promotion_code)
        .single()
      selectedPromotion = promotionData as PricingPromotion | null
    }

    // Generate magic link (if needed)
    let magicLink: string | null = null
    try {
      const magicLinkResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/quotations/generate-magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation_id: quotationId })
      })
      
      if (magicLinkResponse.ok) {
        const magicLinkData = await magicLinkResponse.json()
        magicLink = magicLinkData.magic_link
      }
    } catch (error) {
      console.warn('⚠️ [MIGRATED-SEND-EMAIL API] Could not generate magic link:', error)
    }

    // Determine if this is an updated quotation
    const isUpdated = (quotation.status === 'sent' && quotation.last_sent_at) || 
                     (quotation.updated_at && quotation.created_at && 
                      new Date(quotation.updated_at).getTime() > new Date(quotation.created_at).getTime() + 60000)

    console.log(`✅ [MIGRATED-SEND-EMAIL API] Quotation data prepared: ${quotationId}`)

    // Send email using unified service
    const result = await EmailAPIWrapper.sendQuotationEmail({
      quotation: quotation as any,
      selectedPackage,
      selectedPromotion,
      magicLink,
      isUpdated,
      language: language as 'en' | 'ja',
      bccEmails
    })

    if (!result.success) {
      console.error('❌ [MIGRATED-SEND-EMAIL API] Email sending failed:', result.error)
      return NextResponse.json({ 
        error: result.error || 'Failed to send email' 
      }, { status: 500 })
    }

    // Update quotation status and last sent time
    const { error: updateError } = await supabase
      .from('quotations')
      .update({ 
        status: 'sent',
        last_sent_at: new Date().toISOString()
      })
      .eq('id', quotationId)

    if (updateError) {
      console.warn('⚠️ [MIGRATED-SEND-EMAIL API] Could not update quotation status:', updateError)
    }

    console.log(`✅ [MIGRATED-SEND-EMAIL API] Quotation email sent successfully: ${quotationId}`)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      quotationId,
      email,
      language,
      isUpdated
    })

  } catch (error) {
    console.error('❌ [MIGRATED-SEND-EMAIL API] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}