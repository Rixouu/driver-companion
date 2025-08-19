import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { generateVercelQuotationPDF } from '@/lib/vercel-pdf-generator';
import { enhancedPdfCache } from '@/lib/enhanced-pdf-cache';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  console.log('==================== SEND EMAIL ROUTE START ====================');
  const timeoutId = setTimeout(() => {
    console.error('❌ [SEND EMAIL ROUTE] Request timeout after 45 seconds');
  }, 45000);

  try {
    const { quotationId, email, subject, message, includePdf = true } = await request.json();

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

    let pdfBuffer: Buffer | null = null;

    if (includePdf) {
      try {
        // Generate PDF using Vercel-compatible generator
        pdfBuffer = await generateVercelQuotationPDF(
          quotation, 
          'en', 
          null, 
          null
        );
        console.log('✅ PDF generated successfully using Vercel generator');
      } catch (pdfError) {
        console.error('❌ PDF generation failed:', pdfError);
        // Continue without PDF attachment
        pdfBuffer = null;
      }
    }

    // Prepare email data
    const emailData: any = {
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: email,
      subject: subject || `Quotation ${quotation.title || quotation.id}`,
      html: message || `
        <h2>Quotation Details</h2>
        <p><strong>Title:</strong> ${quotation.title}</p>
        <p><strong>Status:</strong> ${quotation.status}</p>
        <p><strong>Total Amount:</strong> $${quotation.total_amount}</p>
        <p>Please find the quotation attached.</p>
      `
    };

    // Add PDF attachment if available
    if (pdfBuffer) {
      emailData.attachments = [{
        filename: `quotation-${quotation.id}.html`,
        content: pdfBuffer
      }];
    }

    // Send email with timeout
    const emailSendPromise = resend.emails.send(emailData);
    const { data: emailResult, error: resendError } = await Promise.race([
      emailSendPromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000)
      )
    ]);

    if (resendError) {
      throw resendError;
    }

    // Update quotation status to 'sent'
    const { error: updateError } = await supabase
      .from('quotations')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', quotationId);

    if (updateError) {
      console.warn('⚠️ Failed to update quotation status:', updateError);
    }

    clearTimeout(timeoutId);
    console.log('==================== SEND EMAIL ROUTE END ====================');
    
    return NextResponse.json({ 
      message: 'Email sent successfully',
      emailId: emailResult?.id,
      quotationId,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (emailError) {
    console.error('❌ [SEND EMAIL ROUTE] Email sending error:', emailError);
    clearTimeout(timeoutId);
    
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: emailError instanceof Error ? emailError.message : 'Unknown email error',
      code: 'EMAIL_SEND_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } catch (error) {
    console.error('❌ [SEND EMAIL ROUTE] Unexpected error:', error);
    clearTimeout(timeoutId);
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 