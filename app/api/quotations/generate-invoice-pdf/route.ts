import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { generateOptimizedPdfFromHtml } from '@/lib/optimized-html-pdf-generator'
import { PricingPackage, PricingPromotion } from '@/types/quotations'
import { generateInvoiceHtml } from '@/lib/invoice-html-generator'

// Re-export the function for backward compatibility
export { generateInvoiceHtml }

export async function POST(request: NextRequest) {
  try {
    const { quotation_id, language = 'en', status_label } = await request.json()
    
    if (!quotation_id) {
      return NextResponse.json(
        { error: 'Missing quotation_id' },
        { status: 400 }
      )
    }
    
    const supabase = createServiceClient()
    
    // Fetch quotation data
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (*)
      `)
      .eq('id', quotation_id)
      .single()
    
    if (quotationError || !quotation) {
      console.error('❌ [INVOICE-PDF] Quotation not found:', quotationError)
      console.error('❌ [INVOICE-PDF] Quotation ID:', quotation_id)
      return NextResponse.json(
        { error: 'Quotation not found', details: quotationError?.message },
        { status: 404 }
      )
    }
    
    console.log('✅ [INVOICE-PDF] Quotation found:', quotation.id, quotation.quote_number)
    
    // Get selected package and promotion separately
    let selectedPackage: PricingPackage | null = null
    if (quotation.selected_package_id) {
      const { data: packageData } = await supabase
        .from('pricing_packages')
        .select('*')
        .eq('id', quotation.selected_package_id)
        .single()
      selectedPackage = packageData as PricingPackage | null
    }

    let selectedPromotion: PricingPromotion | null = null
    if (quotation.selected_promotion_id) {
      const { data: promotionData } = await supabase
        .from('pricing_promotions')
        .select('*')
        .eq('id', quotation.selected_promotion_id)
        .single()
      selectedPromotion = promotionData as PricingPromotion | null
    }

    // Get template configuration for PDF generation
    const { data: templateData } = await supabase
      .from('pdf_templates' as any)
      .select('template_data, styling')
      .eq('type', 'invoice')
      .eq('is_active', true)
      .single()

    const templateConfig = (templateData as any)?.template_data || {
      showTeamInfo: true,
      showLanguageToggle: true,
      statusConfigs: {
        sent: { showSignature: false, showStatusBadge: true, statusBadgeColor: '#3B82F6', statusBadgeName: 'SENT' },
        pending: { showSignature: false, showStatusBadge: true, statusBadgeColor: '#F59E0B', statusBadgeName: 'PENDING' },
        unpaid: { showSignature: false, showStatusBadge: true, statusBadgeColor: '#EF4444', statusBadgeName: 'UNPAID' },
        paid: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#10B981', statusBadgeName: 'PAID' }
      }
    }

    // Generate HTML
    const htmlContent = await generateInvoiceHtml(
      quotation,
      language as 'en' | 'ja',
      selectedPackage,
      selectedPromotion,
      status_label,
      templateConfig.showTeamInfo,
      templateConfig.statusConfigs
    )

    // Generate PDF
    const pdfBuffer = await generateOptimizedPdfFromHtml(
      htmlContent,
      {
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true
      },
      quotation,
      selectedPackage,
      selectedPromotion,
      language
    )

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${quotation.quote_number || quotation_id}.pdf"`
      }
    })
    
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    )
  }
}