import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { generateOptimizedPdfFromHtml } from '@/lib/optimized-html-pdf-generator'
import { generateQuotationHtml } from '@/lib/quotation-html-generator'
import { getTeamAddressHtml, getTeamFooterHtml } from '@/lib/team-addresses'
import { safeEncodeText } from '@/lib/utils/character-encoding'

export async function POST(request: NextRequest) {
  try {
    const { quotation_id, language = 'en', token } = await request.json()
    
    if (!quotation_id || !token) {
      return NextResponse.json(
        { error: 'Missing quotation_id or token' },
        { status: 400 }
      )
    }
    
    // Create service client (bypasses authentication)
    const supabase = createServiceClient()
    
    let actualQuotationId = quotation_id;
    
    // Check if token is a quote number (QUO-JPDR-XXXXXX) or UUID
    if (token.startsWith('QUO-JPDR-')) {
      const quoteNumber = parseInt(token.replace('QUO-JPDR-', ''));
      if (isNaN(quoteNumber)) {
        return NextResponse.json(
          { error: 'Invalid quote number format' },
          { status: 400 }
        );
      }
      
      // Find quotation by quote number
      const { data: quotationData, error: quotationError } = await supabase
        .from('quotations')
        .select('id')
        .eq('quote_number', quoteNumber)
        .single();
      
      if (quotationError || !quotationData) {
        return NextResponse.json(
          { error: 'Quotation not found' },
          { status: 404 }
        );
      }
      
      actualQuotationId = quotationData.id;
    } else {
      // Token is a UUID, validate magic link
      const { data: magicLinkData, error: magicLinkError } = await supabase
        .from('quotation_magic_links')
        .select('*')
        .eq('token', token)
        .eq('quotation_id', quotation_id)
        .single()
      
      if (magicLinkError || !magicLinkData) {
        return NextResponse.json({ error: 'Invalid or expired magic link' }, { status: 401 })
      }
      
      // Check if magic link is expired
      const now = new Date()
      const expiryDate = new Date(magicLinkData.expires_at)
      if (now > expiryDate) {
        return NextResponse.json({ error: 'Magic link has expired' }, { status: 410 })
      }
    }
    
    // Fetch quotation data using the actual quotation ID
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*, customers (*), quotation_items (*)')
      .eq('id', actualQuotationId)
      .single()
    
    if (error || !quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }
    
    // Fetch promotion data if promotion is selected
    let selectedPromotion = null;
    if (quotation.selected_promotion_code) {
      const { data: promotionData } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', quotation.selected_promotion_code)
        .single();
      selectedPromotion = promotionData;
    }
    
    // Generate HTML content using the same logic as regular PDF generation
    const htmlContent = await generateQuotationHtml(quotation, language as 'en' | 'ja', null, selectedPromotion, true)
    
    // Convert to PDF using the same generator as regular PDF generation
    const pdfBuffer = await generateOptimizedPdfFromHtml(htmlContent, {
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true
    }, quotation, null, null, language)
    
    // Return PDF as blob
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}.pdf"`
      }
    })
    
  } catch (error) {
    console.error('Error generating PDF via magic link:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
