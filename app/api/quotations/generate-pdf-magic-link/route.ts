import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { generateOptimizedPdfFromHtml, generateQuotationHtml } from '@/lib/optimized-html-pdf-generator'
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
    
    // Validate magic link token instead of user authentication
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
    
    // Fetch quotation data
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
    
    // Generate HTML content
    const htmlContent = generateQuotationHtml(quotation, language as 'en' | 'ja', null, null, true)
    
    // Convert to PDF using optimized generator
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
