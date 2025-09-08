import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/dictionaries';
import { Resend } from 'resend';
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator';
import { generateEmailHtml } from '@/lib/email-templates';
import type { Quotation, PricingPackage, PricingPromotion } from '@/types/quotations';

export async function POST(request: NextRequest) {
  console.log('==================== OPTIMIZED APPROVE ROUTE START ====================');
  
  // Set up timeout for the entire request (30 seconds - reduced from 45)
  const timeoutId = setTimeout(() => {
    console.error('❌ [OPTIMIZED APPROVE ROUTE] Request timeout after 30 seconds');
  }, 30000);
  
  try {
    console.log('Optimized approve route - Parsing request body');
    const { id, notes, signature, customerId, skipStatusCheck = false, skipEmail = false, bcc_emails = 'booking@japandriver.com' } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }
    
    // Get translations and create server client in parallel
    console.log('Optimized approve route - Starting parallel initialization');
    const [translations, supabase] = await Promise.all([
      getDictionary(),
      getSupabaseServerClient()
    ]);
    
    const { t } = translations;
    console.log('Optimized approve route - Parallel initialization complete');

    // Authenticate user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      console.error('Optimized approve route - Authentication error', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Optimized approve route - User authenticated:', authUser.id);

    // OPTIMIZATION 1: Parallel data fetching - fetch all required data in parallel
    console.log('Optimized approve route - Starting parallel data fetching');
    const [
      quotationResult,
      fullQuotationResult,
      packageResult,
      promotionResult
    ] = await Promise.allSettled([
      // Get basic quotation for status check
      supabase
        .from('quotations')
        .select('id, status, last_email_sent_at')
        .eq('id', id)
        .single(),
      
      // Get full quotation with customer details for email
      supabase
        .from('quotations')
        .select('*, customers(*), quotation_items(*)')
        .eq('id', id)
        .single(),
      
      // Get package details (if any)
      supabase
        .from('quotations')
        .select('selected_package_id, package_id, pricing_package_id')
        .eq('id', id)
        .single()
        .then(async (result) => {
          if (result.data) {
            const packageId = result.data.selected_package_id || result.data.package_id || result.data.pricing_package_id;
            if (packageId) {
              return supabase
                .from('pricing_packages')
                .select('*, items:pricing_package_items(*)')
                .eq('id', packageId)
                .single();
            }
          }
          return { data: null, error: null };
        }),
      
      // Get promotion details (if any)
      supabase
        .from('quotations')
        .select('selected_promotion_code, promotion_code')
        .eq('id', id)
        .single()
        .then(async (result) => {
          if (result.data) {
            const promotionCode = result.data.selected_promotion_code || result.data.promotion_code;
            if (promotionCode) {
              return supabase
                .from('pricing_promotions')
                .select('*')
                .eq('code', promotionCode)
                .single();
            }
          }
          return { data: null, error: null };
        })
    ]);

    // Process results
    const quotation = quotationResult.status === 'fulfilled' ? quotationResult.value.data : null;
    const fullQuotation = fullQuotationResult.status === 'fulfilled' ? fullQuotationResult.value.data : null;
    const selectedPackage = packageResult.status === 'fulfilled' ? packageResult.value.data : null;
    const selectedPromotion = promotionResult.status === 'fulfilled' ? promotionResult.value.data : null;

    if (!quotation || !fullQuotation) {
      console.log('Optimized approve route - Quotation not found');
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    console.log('Optimized approve route - Parallel data fetching complete');

    // Check if quotation is already approved
    if (quotation.status === 'approved' && !skipStatusCheck) {
      console.log('Optimized approve route - Quotation already approved');
      return NextResponse.json(
        { error: 'Quotation is already approved' },
        { status: 400 }
      );
    }
    
    // Check for recent email to avoid duplicates
    const lastEmailSent = new Date((quotation as any).last_email_sent_at || 0);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (quotation.status === 'approved' && lastEmailSent > fiveMinutesAgo) {
      console.log('Optimized approve route - Skipping duplicate email, one was sent recently');
      return NextResponse.json({ 
        message: 'Quotation already approved, avoiding duplicate email notification'
      }, { status: 200 });
    }
    
    // Ensure we have a valid email address
    const emailAddress = fullQuotation.customer_email || 
                      (fullQuotation.customers ? fullQuotation.customers.email : null);
    
    if (!emailAddress) {
      console.log('Optimized approve route - No valid email address found');
      return NextResponse.json({ 
        message: 'Quotation approved, but no valid email address found',
        error: 'Missing email address'
      }, { status: 200 });
    }
    
    // Skip email if explicitly requested
    if (skipEmail) {
      console.log('Optimized approve route - Skipping email notification as requested');
      return NextResponse.json({ 
        message: 'Quotation approved, email notification skipped' 
      }, { status: 200 });
    }

    // OPTIMIZATION 2: Parallel processing - update database and prepare email data simultaneously
    console.log('Optimized approve route - Starting parallel processing');
    const [updateResult, emailPreparation] = await Promise.allSettled([
      // Update quotation status and log activity in parallel
      Promise.all([
        // Update quotation status
        !skipStatusCheck ? supabase
          .from('quotations')
          .update({ 
            status: 'approved',
            customer_notes: notes,
            approved_at: new Date().toISOString(),
            approved_by: authUser.id,
            approval_signature: signature
          })
          .eq('id', id) : Promise.resolve({ error: null }),
        
        // Log activity
        supabase
          .from('quotation_activities')
          .insert({
            quotation_id: id,
            user_id: authUser.id,
            action: 'approved',
            details: {
              notes: notes || null,
              approved_by_customer_id: customerId,
              approved_by_staff_id: authUser.id
            }
          })
      ]),
      
      // Prepare email data in parallel
      Promise.all([
        // Get updated quotation for PDF generation
        supabase
          .from('quotations')
          .select('*, quotation_items (*)')
          .eq('id', id)
          .single(),
        
        // Prepare email configuration
        Promise.resolve({
          emailDomain: process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com',
          appUrl: process.env.NEXT_PUBLIC_APP_URL || 
                 (process.env.NODE_ENV === 'production' ? 'https://driver-companion.vercel.app' : 'http://localhost:3000'),
          formattedQuotationId: `QUO-JPDR-${fullQuotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`,
          customerName: (fullQuotation.customers ? fullQuotation.customers.name : null) || 
                       fullQuotation.customer_name || 
                       'Customer',
          bccEmailList: bcc_emails.split(',').map((email: string) => email.trim()).filter((email: string) => email)
        })
      ])
    ]);

    // Check for update errors
    if (updateResult.status === 'rejected' || 
        (updateResult.status === 'fulfilled' && updateResult.value[0]?.error)) {
      console.error('Optimized approve route - Error updating quotation:', updateResult);
      return NextResponse.json({ 
        message: 'Quotation approved, but failed to update status',
        error: updateResult.status === 'rejected' ? 'Update failed' : updateResult.value[0]?.error?.message
      }, { status: 200 });
    }

    if (emailPreparation.status === 'rejected') {
      console.error('Optimized approve route - Error preparing email data:', emailPreparation);
      return NextResponse.json({ 
        message: 'Quotation approved, but failed to prepare email data',
        error: 'Email preparation failed'
      }, { status: 200 });
    }

    const [updatedQuotation, emailConfig] = emailPreparation.value;
    console.log('Optimized approve route - Parallel processing complete');

    // OPTIMIZATION 3: Parallel PDF generation and email preparation
    console.log('Optimized approve route - Starting PDF generation and email preparation');
    const [pdfResult, emailHtmlResult] = await Promise.allSettled([
      // Generate PDF
      generateOptimizedQuotationPDF(
        updatedQuotation.data || fullQuotation, 
        'en', 
        selectedPackage, 
        selectedPromotion
      ),
      
      // Generate email HTML
      Promise.resolve(
        generateEmailHtml(
          'en', 
          emailConfig.customerName, 
          emailConfig.formattedQuotationId, 
          fullQuotation, 
          emailConfig.appUrl, 
          notes, 
          fullQuotation.team_location || 'thailand'
        )
      )
    ]);

    // Check PDF generation result
    if (pdfResult.status === 'rejected') {
      console.error('Optimized approve route - PDF generation failed:', pdfResult.reason);
      return NextResponse.json({ 
        message: 'Quotation approved, but failed to generate PDF for email', 
        error: pdfResult.reason instanceof Error ? pdfResult.reason.message : 'PDF generation failed'
      }, { status: 200 });
    }

    const pdfBuffer = pdfResult.value;
    const emailHtml = emailHtmlResult.value;

    console.log('Optimized approve route - PDF and email preparation complete');

    // OPTIMIZATION 4: Send email with optimized timeout
    try {
      console.log(`Optimized approve route - Sending approval email to: ${emailAddress}`);
      
      // Check if API key is configured
      if (!process.env.RESEND_API_KEY) {
        console.error('Optimized approve route - RESEND_API_KEY environment variable is not configured');
        return NextResponse.json(
          { error: 'Email service not configured' },
          { status: 500 }
        );
      }
      
      // Initialize Resend with API key
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Send email with reduced timeout (20 seconds instead of 30)
      const emailSubject = `Your Quotation has been Approved - ${emailConfig.formattedQuotationId}`;
      
      const emailSendPromise = resend.emails.send({
        from: `Driver Japan <booking@${emailConfig.emailDomain}>`,
        to: [emailAddress],
        bcc: emailConfig.bccEmailList,
        subject: emailSubject,
        html: emailHtml,
        attachments: pdfBuffer ? [
          {
            filename: `${emailConfig.formattedQuotationId}-quotation.pdf`,
            content: pdfBuffer.toString('base64')
          }
        ] : undefined
      });

      // Add timeout for email sending (20 seconds - reduced from 30)
      const { data: emailData, error: resendError } = await Promise.race([
        emailSendPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout after 20 seconds')), 20000)
        )
      ]);

      if (resendError) {
        console.error('❌ [OPTIMIZED APPROVE ROUTE] Error reported by Resend:', JSON.stringify(resendError, null, 2));
        throw new Error(`Resend API Error: ${resendError.message || 'Unknown error'}`); 
      }
      
      const emailId = emailData?.id || 'unknown';
      console.log(`Optimized approve route - Email sent successfully! ID: ${emailId}`);
      
      // Update last_email_sent_at (non-blocking)
      supabase
        .from('quotations')
        .update({ 
          last_email_sent_at: new Date().toISOString() 
        } as any)
        .eq('id', id)
        .then(() => console.log('Optimized approve route - Email timestamp updated'))
        .catch(err => console.error('Optimized approve route - Error updating email timestamp:', err));
      
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        message: 'Quotation approved and notification email sent', 
        emailId: emailId 
      }, { status: 200 });
      
    } catch (emailError) {
      console.error('❌ [OPTIMIZED APPROVE ROUTE] Email sending error:', emailError);
      return NextResponse.json({ 
        message: 'Quotation approved, but failed to send notification email',
        error: emailError instanceof Error ? emailError.message : 'Email sending failed'
      }, { status: 200 });
    }
    
  } catch (error) {
    console.error('❌ [OPTIMIZED APPROVE ROUTE] Unexpected error:', error);
    clearTimeout(timeoutId);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
