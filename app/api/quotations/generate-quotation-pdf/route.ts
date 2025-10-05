import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { generateOptimizedPdfFromHtml } from '@/lib/optimized-html-pdf-generator'
import { generateQuotationHtml } from '@/lib/quotation-html-generator'
import { PricingPackage, PricingPromotion } from '@/types/quotations'
import { getTeamAddressHtml, getTeamFooterHtml } from '@/lib/team-addresses'
import { safeEncodeText } from '@/lib/utils/character-encoding'

export async function POST(request: NextRequest) {
  try {
    const { quotation_id, language = 'en', package_id, promotion_code } = await request.json()
    
    if (!quotation_id) {
      return NextResponse.json(
        { error: 'Missing quotation_id' },
        { status: 400 }
      )
    }
    
    // Create service client (bypasses authentication for API-to-API calls)
    const supabase = createServiceClient()
    
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
        send: { showSignature: false, showStatusBadge: true, statusBadgeColor: '#3B82F6', statusBadgeName: 'SENT' },
        pending: { showSignature: false, showStatusBadge: true, statusBadgeColor: '#F59E0B', statusBadgeName: 'PENDING' },
        approved: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#10B981', statusBadgeName: 'APPROVED' },
        rejected: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#EF4444', statusBadgeName: 'REJECTED' },
        paid: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#10B981', statusBadgeName: 'PAID' },
        converted: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#8B5CF6', statusBadgeName: 'CONVERTED' }
      }
    }
    
    // Debug logging to check quotation data
    console.log('Generating quotation PDF with quotation data:', JSON.stringify(quotation, null, 2));
    
    // Generate HTML content with signature support
    const htmlContent = generateQuotationHtml(
      quotation, 
      language as 'en' | 'ja', 
      selectedPackage, 
      selectedPromotion, 
      templateConfig.showTeamInfo,
      templateConfig.statusConfigs
    )
    
    // Convert to PDF using optimized generator
    const pdfBuffer = await generateOptimizedPdfFromHtml(htmlContent, {
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true
    }, quotation, selectedPackage, selectedPromotion, language)
    
    // Return PDF as blob
    return new NextResponse(pdfBuffer as any, {
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