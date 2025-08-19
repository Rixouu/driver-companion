import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator';
import { generateQuotationHtml } from '@/lib/html-pdf-generator';
import { enhancedPdfCache } from '@/lib/enhanced-pdf-cache';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  console.log('🚀 [ROBUST-EMAIL] Starting robust email processing...');
  
  try {
    const { quotationId, email, subject, message, skipStatusCheck = false } = await request.json();
    
    if (!quotationId) {
      return NextResponse.json({ 
        error: 'Quotation ID is required',
        code: 'MISSING_QUOTATION_ID'
      }, { status: 400 });
    }

    // Step 1: Immediate response to client
    const response = NextResponse.json({ 
      message: 'Email processing started',
      quotationId,
      status: 'processing',
      estimatedTime: '10-15 seconds'
    }, { status: 202 });

    // Step 2: Process email in background (don't await)
    processEmailInBackground(quotationId, email, subject, message, skipStatusCheck);

    return response;

  } catch (error) {
    console.error('❌ [ROBUST-EMAIL] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to start email processing',
      code: 'PROCESSING_ERROR'
    }, { status: 500 });
  }
}

async function processEmailInBackground(
  quotationId: string, 
  email: string, 
  subject: string, 
  message: string, 
  skipStatusCheck: boolean
) {
  try {
    console.log(`🔄 [ROBUST-EMAIL] Background processing started for quotation: ${quotationId}`);
    
    // Step 1: Fetch quotation data
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single();

    if (fetchError || !quotation) {
      console.error('❌ [ROBUST-EMAIL] Failed to fetch quotation:', fetchError);
      return;
    }

    // Step 2: Generate PDF (with caching)
    console.log('🔄 [ROBUST-EMAIL] Generating PDF...');
    const pdfBuffer = await generateOptimizedQuotationPDF(
      quotation, 
      'en', 
      quotation.selected_package_id ? quotation.selected_package_id : null,
      quotation.selected_promotion_id ? quotation.selected_promotion_id : null
    );

    // Step 3: Send email via Resend
    console.log('🔄 [ROBUST-EMAIL] Sending email...');
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@drivercompanion.com',
        to: email,
        subject: subject || `Quotation ${quotation.quote_number}`,
        html: message || generateQuotationHtml(quotation, 'en'),
        attachments: [{
          filename: `quotation-${quotation.quote_number}.pdf`,
          content: pdfBuffer.toString('base64'),
        }],
      }),
    });

    if (!resendResponse.ok) {
      throw new Error(`Resend API error: ${resendResponse.statusText}`);
    }

    const emailResult = await resendResponse.json();
    console.log('✅ [ROBUST-EMAIL] Email sent successfully:', emailResult.id);

    // Step 4: Update quotation status
    if (!skipStatusCheck) {
      await supabase
        .from('quotations')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          last_email_sent: new Date().toISOString()
        })
        .eq('id', quotationId);
    }

    // Step 5: Log success
    await supabase
      .from('quotation_activities')
      .insert({
        quotation_id: quotationId,
        activity_type: 'email_sent',
        description: `Email sent to ${email}`,
        metadata: { emailId: emailResult.id, recipient: email }
      });

    console.log('✅ [ROBUST-EMAIL] Background processing completed successfully');

  } catch (error) {
    console.error('❌ [ROBUST-EMAIL] Background processing failed:', error);
    
    // Log error to database
    try {
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: quotationId,
          activity_type: 'email_error',
          description: `Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
    } catch (logError) {
      console.error('❌ [ROBUST-EMAIL] Failed to log error:', logError);
    }
  }
}
