import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n/server';
import { createServiceClient } from '@/lib/supabase/service-client';
import { Resend } from 'resend';
import { generatePdfFromHtml, generateQuotationHtml } from '@/lib/html-pdf-generator';

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
  try {
    console.log('Approve route - Parsing request body');
    const { id, notes, customerId, skipStatusCheck = false, skipEmail = false } = await request.json();
    
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

    // Create service client (doesn't rely on cookies)
    console.log('Approve route - Creating Supabase service client');
    let supabase;
    try {
      supabase = createServiceClient();
      console.log('Approve route - Supabase service client created successfully');
    } catch (serviceClientError) {
      console.error('Approve route - Error creating service client:', serviceClientError);
      return NextResponse.json(
        { error: 'Error connecting to database' },
        { status: 500 }
      );
    }
    
    // Fetch the quotation
    console.log(`Approve route - Fetching quotation with ID: ${id}`);
    let quotation;
    try {
      const { data, error: fetchError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Approve route - Error fetching quotation:', fetchError);
        return NextResponse.json(
          { error: 'Error fetching quotation' },
          { status: 500 }
        );
      }
      
      quotation = data;
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
      const { error: updateError } = await supabase
        .from('quotations')
        .update({ 
          status: 'approved',
          approval_notes: notes,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) {
        console.log(`Approve route - Error updating quotation: ${updateError.message}`);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      
      console.log('Approve route - Quotation status updated to approved');
      
      // Add activity log - only create activity log when status changes to avoid duplication
      try {
        const { error: activityError } = await supabase
          .from('quotation_activities')
          .insert({
            quotation_id: id,
            user_id: customerId || '00000000-0000-0000-0000-000000000000', // System user
            action: 'approved',
            details: { notes: notes || null }
          });
          
        if (activityError) {
          console.log(`Approve route - Error creating activity log: ${activityError.message}`);
          // Non-blocking error, continue processing
        } else {
          console.log('Approve route - Activity log created');
        }
      } catch (activityError) {
        console.error('Approve route - Exception creating activity log:', activityError);
        // Non-blocking error, continue processing
      }
    }
    
    // Skip email if explicitly requested
    if (skipEmail) {
      console.log('Approve route - Skipping email notification as requested');
      return NextResponse.json({ 
        message: 'Quotation approved, email notification skipped' 
      }, { status: 200 });
    }
    
    // Check if quotation already has a recent approval email
    const lastEmailSent = new Date(quotation.last_email_sent_at || 0);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (quotation.status === 'approved' && lastEmailSent > fiveMinutesAgo) {
      console.log('Approve route - Skipping duplicate email, one was sent recently');
      return NextResponse.json({ 
        message: 'Quotation already approved, avoiding duplicate email notification'
      }, { status: 200 });
    }
    
    // Fetch full quotation with customer details for email
    const { data: fullQuotation, error: fetchError } = await supabase
      .from('quotations')
      .select('*, customers(*)')
      .eq('id', id)
      .single();
      
    if (fetchError || !fullQuotation) {
      console.log(`Approve route - Error fetching full quotation: ${fetchError?.message || 'Quotation not found'}`);
      return NextResponse.json({ 
        message: 'Quotation approved, but failed to send notification email',
        error: fetchError?.message 
      }, { status: 200 });
    }
    
    // Ensure we have a valid email address before proceeding
    const emailAddress = fullQuotation.email || 
                      fullQuotation.customer_email || 
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
      // Generate the HTML for the quotation
      const htmlContent = generateQuotationHtml(fullQuotation, 'en');
      
      // Convert the HTML to a PDF
      pdfBuffer = await generatePdfFromHtml(htmlContent, {
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        printBackground: true
      });
      
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
      const formattedQuotationId = `JPDR-${fullQuotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
      
      // Use translation key for subject
      const emailSubject = `${t('email.quotation.approved.subject')} - ${formattedQuotationId}`;
      
      // Customer name with fallback
      const customerName = fullQuotation.customers?.company_name || 
                         fullQuotation.customers?.contact_name || 
                         fullQuotation.customer_name || 
                         'Customer';
      
      // Generate styled email HTML using our helper function
      const emailHtml = generateEmailHtml('en', customerName, formattedQuotationId, fullQuotation, appUrl, notes);
      
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
      console.log(`Approve route - Email sent successfully! ID: ${emailId}`);
      
      // Update last_email_sent_at
      await supabase
        .from('quotations')
        .update({ 
          last_email_sent_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      return NextResponse.json({ 
        message: 'Quotation approved and notification email sent', 
        emailId: emailId 
      }, { status: 200 });
    } catch (emailError) {
      console.error('Approve route - Email sending error:', emailError);
      return NextResponse.json({ 
        message: 'Quotation approved, but failed to send notification email',
        error: emailError instanceof Error ? emailError.message : 'Unknown email error'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Approve route - Unexpected error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  } finally {
    console.log('==================== APPROVE ROUTE END ====================');
  }
} 