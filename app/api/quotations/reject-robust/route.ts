import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator';
import { generateQuotationHtml } from '@/lib/html-pdf-generator';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  console.log('🚀 [ROBUST-REJECT] Starting robust rejection processing...');
  
  try {
    const { id, reason, customerId, skipStatusCheck = false, skipEmail = false } = await request.json();
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Quotation ID is required',
        code: 'MISSING_QUOTATION_ID'
      }, { status: 400 });
    }

    // Step 1: Immediate response to client
    const response = NextResponse.json({ 
      message: 'Rejection processing started',
      quotationId: id,
      status: 'processing',
      estimatedTime: '10-15 seconds'
    }, { status: 202 });

    // Step 2: Process rejection in background (don't await)
    processRejectionInBackground(id, reason, customerId, skipStatusCheck, skipEmail);

    return response;

  } catch (error) {
    console.error('❌ [ROBUST-REJECT] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to start rejection processing',
      code: 'PROCESSING_ERROR'
    }, { status: 500 });
  }
}

async function processRejectionInBackground(
  quotationId: string,
  reason: string,
  customerId: string | null,
  skipStatusCheck: boolean,
  skipEmail: boolean
) {
  try {
    console.log(`🔄 [ROBUST-REJECT] Background processing started for quotation: ${quotationId}`);
    
    // Step 1: Fetch quotation data
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single();

    if (fetchError || !quotation) {
      console.error('❌ [ROBUST-REJECT] Failed to fetch quotation:', fetchError);
      return;
    }

    // Step 2: Update quotation status immediately
    console.log('🔄 [ROBUST-REJECT] Updating quotation status...');
    const updateData: any = {
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: reason || 'No reason provided'
    };

    if (customerId) {
      updateData.customer_id = customerId;
    }

    const { error: updateError } = await supabase
      .from('quotations')
      .update(updateData)
      .eq('id', quotationId);

    if (updateError) {
      throw new Error(`Failed to update quotation: ${updateError.message}`);
    }

          // Step 3: Generate PDF if email is not skipped
      if (!skipEmail) {
        console.log('🔄 [ROBUST-REJECT] Generating PDF...');
        const pdfBuffer = await generateOptimizedQuotationPDF(
          quotation, 
          'en', 
          quotation.selected_package_id ? quotation.selected_package_id : null,
          quotation.selected_promotion_id ? quotation.selected_promotion_id : null
        );

        if (!pdfBuffer) {
          throw new Error('Failed to generate PDF - PDF buffer is null');
        }

        // Step 4: Send rejection email
        console.log('🔄 [ROBUST-REJECT] Sending rejection email...');
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'noreply@drivercompanion.com',
            to: quotation.email || 'admin@drivercompanion.com',
            subject: `Quotation ${quotation.quote_number} - Rejected`,
            html: generateQuotationHtml(quotation, 'en'),
            attachments: [{
              filename: `quotation-${quotation.quote_number}-rejected.pdf`,
              content: pdfBuffer.toString('base64'),
            }],
          }),
        });

      if (!resendResponse.ok) {
        throw new Error(`Resend API error: ${resendResponse.statusText}`);
      }

      const emailResult = await resendResponse.json();
      console.log('✅ [ROBUST-REJECT] Rejection email sent successfully:', emailResult.id);
    }

    // Step 5: Log rejection activity
    await supabase
      .from('quotation_activities')
      .insert({
        quotation_id: quotationId,
        activity_type: 'quotation_rejected',
        description: `Quotation rejected: ${reason || 'No reason provided'}`,
        metadata: { 
          reason, 
          customerId,
          emailSent: !skipEmail
        }
      });

    console.log('✅ [ROBUST-REJECT] Background processing completed successfully');

  } catch (error) {
    console.error('❌ [ROBUST-REJECT] Background processing failed:', error);
    
    // Log error to database
    try {
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: quotationId,
          activity_type: 'rejection_error',
          description: `Rejection processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
    } catch (logError) {
      console.error('❌ [ROBUST-REJECT] Failed to log error:', logError);
    }
  }
}
