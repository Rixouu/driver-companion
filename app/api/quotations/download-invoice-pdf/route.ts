import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quotationId = searchParams.get('quotationId');
    const invoiceId = searchParams.get('invoiceId');
    
    if (!quotationId && !invoiceId) {
      return NextResponse.json(
        { error: 'Missing quotationId or invoiceId parameter' },
        { status: 400 }
      );
    }
    
    // If we have an invoiceId, we need to get the quotationId from the invoice
    let targetQuotationId = quotationId;
    
    if (invoiceId && !quotationId) {
      // For now, we'll use the invoiceId as the quotationId since they're related
      // In a real implementation, you'd query the invoice table to get the quotationId
      targetQuotationId = invoiceId;
    }
    
    // Redirect to the generate-invoice-pdf endpoint
    const generateUrl = `/api/quotations/generate-invoice-pdf`;
    
    // Create a POST request to generate the PDF
    const response = await fetch(`${request.nextUrl.origin}${generateUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quotation_id: targetQuotationId,
        language: 'en' // Default to English, can be made configurable
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate invoice: ${response.statusText}`);
    }
    
    // Get the PDF blob and return it
    const pdfBlob = await response.blob();
    
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="INV-JPDR-${targetQuotationId}.pdf"`
      }
    });
    
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to download invoice PDF' },
      { status: 500 }
    );
  }
}
