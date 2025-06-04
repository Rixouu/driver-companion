import { getSupabaseServerClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'
import html2pdf from 'html2pdf.js'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id
    
    // Create Supabase client
    const supabase = await getSupabaseServerClient()
    
    // Fetch the quotation data from the database
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select(`
        *,
        customers:customer_id (
          name,
          email,
          phone
        )
      `)
      .eq('id', id)
      .single()
    
    if (error || !quotation) {
      console.error('Error fetching quotation:', error)
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }
    
    // Generate an HTML representation of the quotation
    // Similar to what's in the invoice-button.tsx file
    
    // If this is a server-side API, we'd need to use a different approach
    // since html2pdf is a client-side library.
    // We'll need to return the quotation data and let the client-side handle the PDF generation
    
    return NextResponse.json({ 
      quotation,
      message: 'Quotation found. Use client-side generation for PDF.' 
    })
    
    // Note: For true server-side PDF generation, you would need a server-side
    // PDF generation library like PDFKit or a headless browser like Puppeteer.
  } catch (error) {
    console.error('Error processing quotation:', error)
    return NextResponse.json(
      { error: 'Failed to process quotation' },
      { status: 500 }
    )
  }
} 