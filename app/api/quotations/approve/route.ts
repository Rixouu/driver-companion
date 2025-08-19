import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { generatePdfFromHtml, generateQuotationHtml } from '@/lib/html-pdf-generator';
import { Quotation, PricingPackage, PricingPromotion } from '@/types/quotations';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

// Helper function to generate email HTML with styling exactly matching send-email
function generateEmailHtml(language: string, customerName: string, formattedQuotationId: string, quotation: any, appUrl: string, notes?: string) {
  const isJapanese = language === 'ja';
  const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
  
  const translations = {
    en: {
      subject: 'Quotation Approved',
      greeting: 'Hello',
      approved: 'Your quotation has been approved.',
      viewDetails: 'View Quotation Details',
      thankyou: 'Thank you for your business.',
      regards: 'Best regards,',
      company: 'Driver (Thailand) Company Limited',
      notesLabel: 'Notes:',
      additionalInfo: 'From your online quote you can view all details, print, or contact us with any questions.',
      closing: 'We look forward to working with you.'
    },
    ja: {
      subject: '見積書が承認されました',
      greeting: 'こんにちは',
      approved: 'お客様の見積書が承認されました。',
      viewDetails: '見積書の詳細を確認する',
      thankyou: 'ご利用ありがとうございます。',
      regards: '敬具',
      company: 'Driver (Thailand) Company Limited',
      notesLabel: '備考:',
      additionalInfo: 'オンライン見積もりから、詳細確認、印刷、お問い合わせができます。',
      closing: 'よろしくお願いいたします。'
    }
  };
  
  const t = translations[language as 'en' | 'ja'] || translations.en;
  
  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${t.subject}</title>
      <style>
        body, table, td, a {
          -webkit-text-size-adjust:100%;
          -ms-text-size-adjust:100%;
          font-family: Work Sans, sans-serif;
        }
        table, td { mso-table-lspace:0; mso-table-rspace:0; }
        img {
          border:0;
          line-height:100%;
          outline:none;
          text-decoration:none;
          -ms-interpolation-mode:bicubic;
        }
        table { border-collapse:collapse!important; }
        body {
          margin:0;
          padding:0;
          width:100%!important;
          background:#F2F4F6;
        }
        .greeting {
          color:#32325D;
          margin:24px 24px 16px;
          line-height:1.4;
          font-size: 14px;
        }
        @media only screen and (max-width:600px) {
          .container { width:100%!important; }
          .stack { display:block!important; width:100%!important; text-align:center!important; }
        }
        .details-table td, .details-table th {
          padding: 10px 0;
          font-size: 14px;
        }
        .details-table th {
           color: #8898AA;
           text-transform: uppercase;
           text-align: left;
        }
      </style>
    </head>
    <body style="background:#F2F4F6; margin:0; padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding:24px;">
            <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
                   style="background:#FFFFFF; border-radius:8px; overflow:hidden; max-width: 600px;">
              
              <!-- HEADER -->
              <tr>
                <td style="background:linear-gradient(135deg,#E03E2D 0%,#F45C4C 100%);">
                  <table width="100%" role="presentation">
                    <tr>
                      <td align="center" style="padding:24px;">
                        <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 12px;">
                          <tr><td align="center" valign="middle" style="text-align:center;">
                              <img src="${logoUrl}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
                          </td></tr>
                        </table>
                        <h1 style="margin:0; font-size:24px; color:#FFF; font-weight:600;">
                          ${isJapanese ? '見積書が承認されました' : 'Your Quotation has been Approved'}
                        </h1>
                        <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                          ${isJapanese ? '見積書番号' : 'Quotation'} #${formattedQuotationId}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- GREETING -->
              <tr>
                <td>
                  <p class="greeting">
                    ${t.greeting} ${customerName},<br><br>
                    ${t.approved}
                  </p>
                </td>
              </tr>
              
              <!-- NOTES BLOCK (IF ANY) -->
              ${notes ? `
              <tr>
                <td style="padding:0 24px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="details-table"
                        style="background:#F8FAFC; border-radius:8px;">
                    <tr>
                      <td style="padding:16px;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <th width="30%" style="vertical-align:top; padding-top:5px;">${t.notesLabel}</th>
                            <td style="font-size:14px; color:#32325D; line-height:1.6;">${notes}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ` : ''}
              
              <!-- CTA SECTION -->
              <tr>
                <td style="padding:12px 24px 24px; text-align: center;">
                  <a href="${appUrl}/quotations/${quotation.id}"
                     style="display:inline-block; padding:12px 24px; background:#E03E2D; color:#FFF;
                            text-decoration:none; border-radius:4px; font-family: Work Sans, sans-serif;
                            font-size:16px; font-weight:600; text-align: center;">
                    ${t.viewDetails}
                  </a>
                </td>
              </tr>
              
              <!-- ADDITIONAL INFO -->
              <tr>
                <td style="padding:0px 24px 24px;">
                  <p style="margin:20px 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${t.additionalInfo}
                  </p>
                  <p style="margin:0 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${t.closing}
                  </p>
                  <p style="margin:16px 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${t.regards}<br>
                    ${t.company}
                  </p>
                </td>
              </tr>
              
              <!-- FOOTER -->
              <tr>
                <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: Work Sans, sans-serif; font-size:12px; color:#8898AA;">
                  <p style="margin:0 0 4px;">${t.company}</p>
                  <p style="margin:0;">
                    <a href="https://japandriver.com" style="color:#E03E2D; text-decoration:none;">
                      japandriver.com
                    </a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;
}

export async function POST(request: NextRequest) {
  console.log('==================== APPROVE ROUTE START ====================');
  
  // Set up timeout for the entire request (45 seconds)
  const timeoutId = setTimeout(() => {
    console.error('❌ [APPROVE ROUTE] Request timeout after 45 seconds');
  }, 45000);
  
  try {
    console.log('Approve route - Parsing request body');
    const { id, notes, signature, customerId, skipStatusCheck = false, skipEmail = false } = await request.json();
    
    console.log(`Approve route - Request data: id=${id}, notes=${notes ? 'provided' : 'null'}, customerId=${customerId || 'null'}, skipStatusCheck=${skipStatusCheck}, skipEmail=${skipEmail}`);
    
    if (!id) {
      console.log('Approve route - Missing quotation ID');
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }
    
    // Get translations
    console.log('Approve route - Getting translations');
    const { t } = await getDictionary();

    // Create server client (relies on cookies for auth)
    console.log('Approve route - Creating Supabase server client');
    let supabase;
    try {
      supabase = await getSupabaseServerClient();
      console.log('Approve route - Supabase server client created successfully');
    } catch (serverClientError) {
      console.error('Approve route - Error creating server client:', serverClientError);
      return NextResponse.json(
        { error: 'Error connecting to database' },
        { status: 500 }
      );
    }

    // Authenticate user (staff member performing the approval)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      console.error('Approve route - Authentication error', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Approve route - User authenticated:', authUser.id);

    // Fetch the quotation
    console.log(`Approve route - Fetching quotation with ID: ${id}`);
    let quotation;
    try {
      const { data, error: fetchError } = await supabase
        .from('quotations')
        .select('*, quotation_items (*)')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Approve route - Error fetching quotation:', fetchError);
        return NextResponse.json(
          { error: 'Error fetching quotation' },
          { status: 500 }
        );
      }
      
      quotation = data as Quotation;
      console.log(`Approve route - Quotation fetched successfully. ID: ${quotation.id}, Status: ${quotation.status}, Quote Number: ${quotation.quote_number}`);
    } catch (fetchError) {
      console.error('Approve route - Exception fetching quotation:', fetchError);
      return NextResponse.json(
        { error: 'Error fetching quotation data' },
        { status: 500 }
      );
    }
    
    // Only check status if skipStatusCheck is false
    if (!skipStatusCheck && quotation.status === 'approved') {
      console.log(`Approve route - Cannot approve quotation with status: ${quotation.status}`);
      return NextResponse.json(
        { error: `Cannot approve quotation with status: ${quotation.status}` },
        { status: 400 }
      );
    }
    
    // Only update status if needed
    if (!skipStatusCheck) {
      console.log('Approve route - Updating quotation with signature:', {
        id,
        hasSignature: !!signature,
        signatureLength: signature?.length || 0,
        signaturePreview: signature?.substring(0, 50) + '...' || 'none'
      });
      
      const { error: updateError } = await supabase
        .from('quotations')
        .update({ 
          status: 'approved',
          customer_notes: notes,
          approved_at: new Date().toISOString(),
          approved_by: authUser.id,
          approval_signature: signature
        })
        .eq('id', id);
      
      if (updateError) {
        console.log(`Approve route - Error updating quotation: ${updateError.message}`);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      
      console.log('Approve route - Quotation status updated to approved');
      
      // Log activity
      await supabase
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
        });
    }
    
    // Skip email if explicitly requested
    if (skipEmail) {
      console.log('Approve route - Skipping email notification as requested');
      return NextResponse.json({ 
        message: 'Quotation approved, email notification skipped' 
      }, { status: 200 });
    }
    
    // Check if quotation already has a recent approval email
    const lastEmailSent = new Date((quotation as any).last_email_sent_at || 0);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (quotation.status === 'approved' && lastEmailSent > fiveMinutesAgo) {
      console.log('Approve route - Skipping duplicate email, one was sent recently');
      return NextResponse.json({ 
        message: 'Quotation already approved, avoiding duplicate email notification'
      }, { status: 200 });
    }
    
    // Fetch full quotation with customer details for email
    const { data: fullQuotationData, error: fetchError } = await supabase
      .from('quotations')
      .select('*, customers(*), quotation_items(*)')
      .eq('id', id)
      .single();
      
    const fullQuotation = fullQuotationData as Quotation;

    if (fetchError || !fullQuotation) {
      console.log(`Approve route - Error fetching full quotation: ${fetchError?.message || 'Quotation not found'}`);
      return NextResponse.json({ 
        message: 'Quotation approved, but failed to send notification email',
        error: fetchError?.message 
      }, { status: 200 });
    }
    
    // Fetch associated package and promotion for the PDF
    let selectedPackage: PricingPackage | null = null;
    const packageId = (fullQuotation as any).selected_package_id || (fullQuotation as any).package_id || (fullQuotation as any).pricing_package_id;
    if (packageId) {
        const { data: pkg } = await supabase.from('pricing_packages').select('*, items:pricing_package_items(*)').eq('id', packageId).single();
        selectedPackage = pkg as PricingPackage | null;
    }

    let selectedPromotion: PricingPromotion | null = null;
    const promotionCode = (fullQuotation as any).selected_promotion_code || (fullQuotation as any).promotion_code;
    if (promotionCode) {
        const { data: promo } = await supabase.from('pricing_promotions').select('*').eq('code', promotionCode).single();
        selectedPromotion = promo as PricingPromotion | null;
    }
    
    // Ensure we have a valid email address before proceeding
    const emailAddress = fullQuotation.customer_email || 
                      (fullQuotation.customers ? fullQuotation.customers.email : null);
    
    if (!emailAddress) {
      console.log('Approve route - No valid email address found for this quotation');
      return NextResponse.json({ 
        message: 'Quotation approved, but no valid email address found',
        error: 'Missing email address'
      }, { status: 200 });
    }
    
    // Generate PDF
    console.log('Approve route - Generating PDF for email attachment');
    let pdfBuffer;
    try {
      // Fetch the updated quotation to get the signature
      const { data: updatedQuotation } = await supabase
        .from('quotations')
        .select('*, quotation_items (*)')
        .eq('id', id)
        .single();
      
      console.log('Approve route - Updated quotation signature status:', {
        id: updatedQuotation?.id,
        status: updatedQuotation?.status,
        hasApprovalSignature: !!updatedQuotation?.approval_signature,
        approvalSignatureLength: updatedQuotation?.approval_signature?.length || 0,
        approvalSignaturePreview: updatedQuotation?.approval_signature?.substring(0, 50) + '...' || 'none'
      });
      
      // Generate PDF using the ORIGINAL working generator
      const pdfBuffer = await generatePdfFromHtml(
        generateQuotationHtml(updatedQuotation || fullQuotation, 'en', selectedPackage, selectedPromotion)
      );
      
      console.log('Approve route - PDF generated successfully');
    } catch (pdfError) {
      console.error('Approve route - PDF generation error:', pdfError);
      return NextResponse.json({ 
        message: 'Quotation approved, but failed to generate PDF for email', 
        error: pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'
      }, { status: 200 });
    }
    
    // Send email notification
    try {
      console.log(`Approve route - Sending approval email to: ${emailAddress}`);
      
      // Check if API key is configured
      if (!process.env.RESEND_API_KEY) {
        console.error('Approve route - RESEND_API_KEY environment variable is not configured');
        return NextResponse.json(
          { error: 'Email service not configured' },
          { status: 500 }
        );
      }
      
      // Initialize Resend with API key
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Get email domain from env or fallback
      const emailDomain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com';
      
      // Get the public URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
      
      // Format quotation ID
      const formattedQuotationId = `QUO-JPDR-${fullQuotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
      
      // Use translation key for subject
      const emailSubject = `${t('email.quotation.approved.subject')} - ${formattedQuotationId}`;
      
      // Customer name with fallback
      const customerName = (fullQuotation.customers ? fullQuotation.customers.name : null) || 
                         fullQuotation.customer_name || 
                         'Customer';
      
      // Generate styled email HTML using our helper function
      const emailHtml = generateEmailHtml('en', customerName, formattedQuotationId, fullQuotation, appUrl, notes);
      
      // Send email with timeout
      console.log('🔄 [APPROVE ROUTE] Sending approval email via Resend...');
      const emailSendPromise = resend.emails.send({
        from: `Driver Japan <booking@${emailDomain}>`,
        to: [emailAddress],
        subject: emailSubject,
        html: emailHtml,
        attachments: pdfBuffer ? [
          {
            filename: `${formattedQuotationId}-quotation.pdf`,
            content: pdfBuffer.toString('base64')
          }
        ] : undefined
      });

      // Add timeout for email sending (30 seconds)
      const { data: emailData, error: resendError } = await Promise.race([
        emailSendPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000)
        )
      ]);

      if (resendError) {
        console.error('❌ [APPROVE ROUTE] Error reported by Resend:', JSON.stringify(resendError, null, 2));
        throw new Error(`Resend API Error: ${resendError.message || 'Unknown error'}`); 
      }
      
      const emailId = emailData?.id || 'unknown';
      console.log(`Approve route - Email sent successfully! ID: ${emailId}`);
      
      // Update last_email_sent_at
      await supabase
        .from('quotations')
        .update({ 
          last_email_sent_at: new Date().toISOString() 
        } as any)
        .eq('id', id);
      
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        message: 'Quotation approved and notification email sent', 
        emailId: emailId 
      }, { status: 200 });
    } catch (emailError) {
      console.error('❌ [APPROVE ROUTE] Email sending error:', emailError);
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        message: 'Quotation approved, but failed to send notification email',
        error: emailError instanceof Error ? emailError.message : 'Unknown email error',
        code: 'EMAIL_SEND_ERROR',
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }
  } catch (error) {
    console.error('❌ [APPROVE ROUTE] Unexpected error:', error);
    clearTimeout(timeoutId);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    console.log('==================== APPROVE ROUTE END ====================');
  }
} 