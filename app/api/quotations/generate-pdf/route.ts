import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator'
import { generateQuotationHtml } from '@/lib/html-pdf-generator'
import { PricingPackage, PricingPromotion } from '@/types/quotations'

export async function POST(request: NextRequest) {
  try {
    const { quotation_id, language = 'en', package_id, promotion_code } = await request.json()
    
    if (!quotation_id) {
      return NextResponse.json(
        { error: 'Missing quotation_id' },
        { status: 400 }
      )
    }
    
    // Create server client
    const supabase = await getSupabaseServerClient()
    
    // Authenticate user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Fetch quotation data including signature fields
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*, customers (*), quotation_items (*)')
      .eq('id', quotation_id)
      .single()
    
    if (error || !quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }
    
    // Fetch associated package and promotion
    let selectedPackage: PricingPackage | null = null
    if (package_id) {
      const { data: pkg } = await supabase
        .from('pricing_packages')
        .select('*, items:pricing_package_items(*)')
        .eq('id', package_id)
        .single()
      selectedPackage = pkg as PricingPackage | null
    }

    let selectedPromotion: PricingPromotion | null = null
    if (promotion_code) {
      const { data: promo } = await supabase
        .from('pricing_promotions')
        .select('*')
        .eq('code', promotion_code)
        .single()
      selectedPromotion = promo as PricingPromotion | null
    }
    
    // Generate PDF directly using optimized generator
    const pdfBuffer = await generateOptimizedQuotationPDF(
      quotation, 
      language, 
      selectedPackage, 
      selectedPromotion
    )
    
    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'Failed to generate PDF' },
        { status: 500 }
      )
    }
    
    // Return PDF as blob
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}.pdf"`
      }
    })
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
} 