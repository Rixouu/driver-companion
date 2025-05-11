import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n/server';
import { createServiceClient } from '@/lib/supabase/service-client';
import { Resend } from 'resend';
import { generatePdfFromHtml, generateQuotationHtml } from '@/lib/html-pdf-generator';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

// Helper function to generate email HTML with styling exactly matching send-email
function generateEmailHtml(language: string, customerName: string, formattedQuotationId: string, quotation: any, appUrl: string, reason?: string) {
  const isJapanese = language === 'ja';
  const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
  
  const translations = {
    en: {
      subject: 'Quotation Rejected',
      greeting: 'Hello',
      rejected: 'Your quotation has been rejected.',
      viewDetails: 'View Quotation Details',
      contactUs: 'If you have any questions, please contact us.',
      regards: 'Best regards,',
      company: 'Driver (Thailand) Company Limited',
      reasonLabel: 'Reason:',
      additionalInfo: 'From your online quote you can view all details, print, or contact us with any questions.',
      closing: 'Thank you for your interest in our services.'
    },
    ja: {
      subject: '見積書が却下されました',
      greeting: 'こんにちは',
      rejected: 'お客様の見積書が却下されました。',
      viewDetails: '見積書の詳細を確認する',
      contactUs: 'ご質問がございましたら、お気軽にお問い合わせください。',
      regards: '敬具',
      company: 'Driver (Thailand) Company Limited',
      reasonLabel: '理由:',
      additionalInfo: 'オンライン見積もりから、詳細確認、印刷、お問い合わせができます。',
      closing: '弊社サービスへのご関心をいただき、ありがとうございます。'
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
                          ${isJapanese ? '見積書が却下されました' : 'Your Quotation has been Rejected'}
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
                    ${t.rejected}
                  </p>
                </td>
              </tr>
              
              <!-- REASON BLOCK (IF ANY) -->
              ${reason ? `
              <tr>
                <td style="padding:0 24px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="details-table"
                        style="background:#F8FAFC; border-radius:8px;">
                    <tr>
                      <td style="padding:16px;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <th width="30%" style="vertical-align:top; padding-top:5px;">${t.reasonLabel}</th>
                            <td style="font-size:14px; color:#32325D; line-height:1.6;">${reason}</td>
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
  console.log('==================== REJECT ROUTE START ====================');
  
  // Get translations
  console.log('Reject route - Getting translations');
  const { t } = await getDictionary();
  
  // Create service client (doesn't rely on cookies)
  console.log('Reject route - Creating Supabase service client');
  let supabase;
  try {
    supabase = createServiceClient();
    console.log('Reject route - Supabase service client created successfully');
  } catch (serviceClientError) {
    console.error('Reject route - Error creating service client:', serviceClientError);
    return NextResponse.json(
      { error: 'Error connecting to database' },
      { status: 500 }
    );
  }

  try {
    const { id, reason, customerId, skipStatusCheck = false, skipEmail = false } = await request.json();
    
    console.log(`Reject route - Request data: id=${id}, reason=${reason || 'provided'}, customerId=${customerId || 'null'}, skipStatusCheck=${skipStatusCheck}, skipEmail=${skipEmail}`);
    
    if (!id) {
      console.log('Reject route - Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Fetch the quotation
    console.log(`Reject route - Fetching quotation with ID: ${id}`);
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !quotation) {
      console.log(`Reject route - Error fetching quotation: ${error?.message || 'Quotation not found'}`);
      return NextResponse.json({ error: error?.message || 'Quotation not found' }, { status: 404 });
    }
    
    console.log(`Reject route - Quotation fetched successfully. ID: ${quotation.id}, Status: ${quotation.status}, Quote Number: ${quotation.quote_number}`);
    
    // Only check status if skipStatusCheck is false
    if (!skipStatusCheck && quotation.status === 'rejected') {
      console.log(`Reject route - Cannot reject quotation with status: ${quotation.status}`);
      return NextResponse.json({ error: `Cannot reject quotation with status: ${quotation.status}` }, { status: 400 });
    }

    // Only update status if needed
    if (!skipStatusCheck) {
      const { error: updateError } = await supabase
        .from('quotations')
        .update({ 
          status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) {
        console.log(`Reject route - Error updating quotation: ${updateError.message}`);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      
      console.log('Reject route - Quotation status updated to rejected');
      
      // Add activity log - only create activity log when status changes to avoid duplication
      try {
        const { error: activityError } = await supabase
          .from('quotation_activities')
          .insert({
            quotation_id: id,
            user_id: customerId || '00000000-0000-0000-0000-000000000000', // System user
            action: 'rejected',
            details: { reason: reason || 'No reason provided' }
          });
          
        if (activityError) {
          console.log(`Reject route - Error creating activity log: ${activityError.message}`);
          // Non-blocking error, continue processing
        } else {
          console.log('Reject route - Activity log created');
        }
      } catch (activityError) {
        console.error('Reject route - Exception creating activity log:', activityError);
        // Non-blocking error, continue processing
      }
    }
    
    // Skip email if explicitly requested
    if (skipEmail) {
      console.log('Reject route - Skipping email notification as requested');
      return NextResponse.json({ 
        message: 'Quotation rejected, email notification skipped' 
      }, { status: 200 });
    }
    
    // Check if quotation already has a recent rejection email
    const lastEmailSent = new Date(quotation.last_email_sent_at || 0);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (quotation.status === 'rejected' && lastEmailSent > fiveMinutesAgo) {
      console.log('Reject route - Skipping duplicate email, one was sent recently');
      return NextResponse.json({ 
        message: 'Quotation already rejected, avoiding duplicate email notification'
      }, { status: 200 });
    }
    
    // Fetch full quotation with customer details for email
    const { data: fullQuotation, error: fetchError } = await supabase
      .from('quotations')
      .select('*, customers(*)')
      .eq('id', id)
      .single();
      
    if (fetchError || !fullQuotation) {
      console.log(`Reject route - Error fetching full quotation: ${fetchError?.message || 'Quotation not found'}`);
      return NextResponse.json({ 
        message: 'Quotation rejected, but failed to send notification email',
        error: fetchError?.message 
      }, { status: 200 });
    }
    
    // Ensure we have a valid email address before proceeding
    const emailAddress = fullQuotation.email || 
                      fullQuotation.customer_email || 
                      (fullQuotation.customers ? fullQuotation.customers.email : null);
    
    if (!emailAddress) {
      console.log('Reject route - No valid email address found for this quotation');
      return NextResponse.json({ 
        message: 'Quotation rejected, but no valid email address found',
        error: 'Missing email address'
      }, { status: 200 });
    }
    
    // Generate PDF
    console.log('Reject route - Generating PDF for email attachment');
    let pdfBuffer;
    try {
      // Generate the HTML for the quotation
      const htmlContent = generateQuotationHtml(fullQuotation, 'en');
      
      // Convert the HTML to a PDF
      pdfBuffer = await generatePdfFromHtml(htmlContent, {
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        printBackground: true
      });
      
      console.log('Reject route - PDF generated successfully');
    } catch (pdfError) {
      console.error('Reject route - PDF generation error:', pdfError);
      return NextResponse.json({ 
        message: 'Quotation rejected, but failed to generate PDF for email', 
        error: pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'
      }, { status: 200 });
    }
    
    // Send email notification
    try {
      console.log(`Reject route - Sending rejection email to: ${emailAddress}`);
      
      // Check if API key is configured
      if (!process.env.RESEND_API_KEY) {
        console.error('Reject route - RESEND_API_KEY environment variable is not configured');
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
      const formattedQuotationId = `JPDR-${fullQuotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
      
      // Use translation key for subject
      const emailSubject = `${t('email.quotation.rejected.subject')} - ${formattedQuotationId}`;
      
      // Customer name with fallback
      const customerName = fullQuotation.customers?.company_name || 
                         fullQuotation.customers?.contact_name || 
                         fullQuotation.customer_name || 
                         'Customer';
      
      // Generate styled email HTML using our helper function
      const emailHtml = generateEmailHtml('en', customerName, formattedQuotationId, fullQuotation, appUrl, reason);
      
      const { data: emailData } = await resend.emails.send({
        from: `Driver Japan <booking@${emailDomain}>`,
        to: [emailAddress],
        subject: emailSubject,
        html: emailHtml,
        attachments: pdfBuffer ? [
          {
            filename: `quotation-${formattedQuotationId}.pdf`,
            content: pdfBuffer.toString('base64')
          }
        ] : undefined
      });
      
      const emailId = emailData?.id || 'unknown';
      console.log(`Reject route - Email sent successfully! ID: ${emailId}`);
      
      // Update last_email_sent_at
      await supabase
        .from('quotations')
        .update({ 
          last_email_sent_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      return NextResponse.json({ 
        message: 'Quotation rejected and notification email sent', 
        emailId: emailId 
      }, { status: 200 });
    } catch (emailError) {
      console.error('Reject route - Email sending error:', emailError);
      return NextResponse.json({ 
        message: 'Quotation rejected, but failed to send notification email',
        error: emailError instanceof Error ? emailError.message : 'Unknown email error'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Reject route - Unexpected error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  } finally {
    console.log('==================== REJECT ROUTE END ====================');
  }
} 