import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { generateVercelQuotationPDF } from '@/lib/vercel-pdf-generator';
import { enhancedPdfCache } from '@/lib/enhanced-pdf-cache';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  console.log('==================== APPROVE ROUTE START ====================');
  const timeoutId = setTimeout(() => {
    console.error('❌ [APPROVE ROUTE] Request timeout after 45 seconds');
  }, 45000);

  try {
    const { quotationId, email, subject, message } = await request.json();

    if (!quotationId || !email) {
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        error: 'Missing required fields: quotationId and email',
        code: 'MISSING_FIELDS',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Fetch quotation data
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select(`
        *,
        items:quotation_items(*),
        customer:customers(*),
        service_type:service_types(*)
      `)
      .eq('id', quotationId)
      .single();

    if (quotationError || !quotation) {
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        error: 'Quotation not found',
        code: 'QUOTATION_NOT_FOUND',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // Update quotation status to 'approved'
    const { data: updatedQuotation, error: updateError } = await supabase
      .from('quotations')
      .update({ 
        status: 'approved', 
        approved_at: new Date().toISOString(),
        approved_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', quotationId)
      .select()
      .single();

    if (updateError) {
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        error: 'Failed to update quotation status',
        code: 'UPDATE_ERROR',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Generate PDF using Vercel-compatible generator
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateVercelQuotationPDF(
        updatedQuotation || quotation, 
        'en', 
        null, 
        null
      );
      console.log('✅ PDF generated successfully using Vercel generator');
    } catch (pdfError) {
      console.error('❌ PDF generation failed:', pdfError);
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        error: 'Failed to generate PDF',
        code: 'PDF_GENERATION_ERROR',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Prepare email data
    const emailPayload: any = {
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: email,
      subject: subject || `Quotation Approved: ${quotation.title || quotation.id}`,
      html: message || `
        <h2>Quotation Approved!</h2>
        <p><strong>Title:</strong> ${quotation.title}</p>
        <p><strong>Status:</strong> Approved</p>
        <p><strong>Total Amount:</strong> $${quotation.total_amount}</p>
        <p>Your quotation has been approved. Please find the approved quotation attached.</p>
      `,
      attachments: [{
        filename: `approved-quotation-${quotation.id}.html`,
        content: pdfBuffer
      }]
    };

    // Send email with timeout
    const emailSendPromise = resend.emails.send(emailPayload);
    const { data: emailResult, error: resendError } = await Promise.race([
      emailSendPromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000)
      )
    ]);

    if (resendError) {
      throw resendError;
    }

    clearTimeout(timeoutId);
    console.log('==================== APPROVE ROUTE END ====================');
    
    return NextResponse.json({ 
      message: 'Quotation approved and email sent successfully',
      quotationId,
      emailId: emailResult?.id,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('❌ [APPROVE ROUTE] Error:', error);
    clearTimeout(timeoutId);
    
    // Check if it's an email error
    if (error instanceof Error && error.message.includes('email')) {
      return NextResponse.json({ 
        message: 'Quotation approved, but failed to send notification email',
        error: error.message,
        code: 'EMAIL_SEND_ERROR',
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }
    
    // Handle other errors
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 