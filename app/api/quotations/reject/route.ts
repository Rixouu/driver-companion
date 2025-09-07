import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator';
import { Quotation, PricingPackage, PricingPromotion } from '@/types/quotations';
import { getTeamFooterHtml } from '@/lib/team-addresses';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

// Helper function to generate rejection email HTML (copied from reject-magic-link)
function generateEmailHtml(language: string, customerName: string, formattedQuotationId: string, quotation: any, appUrl: string, reason?: string, teamLocation: 'japan' | 'thailand' = 'thailand') {
  const isJapanese = language === 'ja';
  
  const translations = {
    en: {
      subject: 'Your Quotation has been Rejected',
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
      <title>Your Quotation has been Rejected</title>
      <style>
        body, table, td, a {
          -webkit-text-size-adjust:100%;
          -ms-text-size-adjust:100%;
          font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif;
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
        .button {
          background-color: #dc3545;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          display: inline-block;
          margin: 16px 0;
        }
        .reason {
          background-color: #f8d7da;
          border-left: 4px solid #dc3545;
          padding: 16px;
          margin: 16px 0;
          border-radius: 4px;
        }
        .contact-info {
          background-color: #f8f9fa;
          border-left: 4px solid #6c757d;
          padding: 16px;
          margin: 16px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body style="background:#F2F4F6; margin:0; padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding:24px;">
            <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
                   style="background:#FFFFFF; border-radius:8px; overflow:hidden; max-width: 600px;">
              
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#E03E2D 0%,#F45C4C 100%); padding:32px 24px; text-align:center;">
                  <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 12px;">
                    <tr><td align="center" valign="middle" style="text-align:center;">
                        <img src="https://japandriver.com/img/driver-invoice-logo.png" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
                    </td></tr>
                  </table>
                  <h1 style="color:white; margin:0; font-size:24px; font-weight:600;">
                    ${isJapanese ? '見積書が却下されました' : 'Your Quotation has been Rejected'}
                  </h1>
                  <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                    ${isJapanese ? '見積書番号' : 'Quotation'} #${formattedQuotationId}
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding:32px 24px;">
                  <div class="greeting">
                    <p>${isJapanese ? 'こんにちは' : 'Hello'} ${customerName},</p>
                    
                    <p>${isJapanese ? 'お客様の見積書に関する更新についてお知らせいたします。' : 'We wanted to inform you about an update regarding your quotation.'}</p>
                    
                    <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
                      <h3 style="margin:0 0 12px 0; color:#32325D;">${isJapanese ? '見積書詳細' : 'Quotation Details'}</h3>
                      <p style="margin:0; color:#525f7f;">
                        <strong>${isJapanese ? '見積書ID:' : 'Quotation ID:'}</strong> ${formattedQuotationId}<br>
                        <strong>${isJapanese ? 'タイトル:' : 'Title:'}</strong> ${quotation.title || (isJapanese ? '無題' : 'Untitled')}<br>
                        <strong>${isJapanese ? '合計金額:' : 'Total Amount:'}</strong> ${quotation.currency || 'JPY'} ${quotation.total_amount?.toLocaleString() || '0'}<br>
                        <strong>${isJapanese ? 'ステータス:' : 'Status:'}</strong> <span style="color:#dc3545; font-weight:600;">${isJapanese ? '却下' : 'Rejected'}</span><br>
                        <strong>${isJapanese ? '日付:' : 'Date:'}</strong> ${new Date().toLocaleDateString()}
                      </p>
                    </div>
                    
                    ${reason ? `
                      <div class="reason">
                        <h4 style="margin:0 0 8px 0; color:#525f7f;">${isJapanese ? '却下理由:' : 'Reason for Rejection:'}</h4>
                        <p style="margin:0; color:#6c757d;">${reason}</p>
                      </div>
                    ` : ''}

                    <div class="contact-info">
                      <h4 style="margin:0 0 8px 0; color:#495057;">${isJapanese ? 'サポートが必要ですか？' : 'Need Help?'}</h4>
                      <p style="margin:0; color:#6c757d;">
                        ${isJapanese ? 'この決定についてご質問がある場合や、代替案について話し合いたい場合は、お気軽にお問い合わせください。お客様に合った解決策を見つけるお手伝いをいたします。' : 'If you have any questions about this decision or would like to discuss alternatives, please don\'t hesitate to contact us. We\'re here to help find a solution that works for you.'}
                      </p>
                    </div>
                    
                    <p>${isJapanese ? '弊社サービスへのご関心をいただき、ありがとうございます。今後もお客様とお仕事ができる機会を楽しみにしております。' : 'We appreciate your interest in our services and hope to have the opportunity to work with you in the future.'}</p>
                    
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; font-size:12px; color:#8898AA;">
                  ${getTeamFooterHtml(teamLocation, isJapanese)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  console.log('==================== REJECT ROUTE START ====================');
  
  // Set up timeout for the entire request (45 seconds)
  const timeoutId = setTimeout(() => {
    console.error('❌ [REJECT ROUTE] Request timeout after 45 seconds');
  }, 45000);
  
  // Get translations
  console.log('Reject route - Getting translations');
  const { t } = await getDictionary();
  
  // Create server client (relies on cookies for auth)
  console.log('Reject route - Creating Supabase server client');
  let supabase;
  try {
    supabase = await getSupabaseServerClient();
    console.log('Reject route - Supabase server client created successfully');
  } catch (serviceClientError) {
    console.error('Reject route - Error creating server client:', serviceClientError);
    return NextResponse.json(
      { error: 'Error connecting to database' },
      { status: 500 }
    );
  }

  // Authenticate user (staff member performing the rejection)
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    console.error('Reject route - Authentication error', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('Reject route - User authenticated:', authUser.id);

  try {
    const { id, reason, signature, customerId, skipStatusCheck = false, skipEmail = false, bcc_emails = 'booking@japandriver.com' } = await request.json();
    
    console.log(`Reject route - Request data: id=${id}, reason=${reason || 'provided'}, customerId=${customerId || 'null'}, skipStatusCheck=${skipStatusCheck}, skipEmail=${skipEmail}`);
    
    if (!id) {
      console.log('Reject route - Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Fetch the quotation
    console.log(`Reject route - Fetching quotation with ID: ${id}`);
    let quotation;
    try {
      const { data, error: fetchError } = await supabase
        .from('quotations')
        .select('*, quotation_items (*)') // Include quotation_items
        .eq('id', id)
        .single();
      
      if (fetchError || !data) {
        console.log(`Reject route - Error fetching quotation: ${fetchError?.message || 'Quotation not found'}`);
        return NextResponse.json({ error: fetchError?.message || 'Quotation not found' }, { status: 404 });
      }
      
      quotation = data as Quotation;
      console.log(`Reject route - Quotation fetched successfully. ID: ${quotation.id}, Status: ${quotation.status}, Quote Number: ${quotation.quote_number}`);
    } catch (fetchError) {
      console.error('Reject route - Error fetching quotation:', fetchError);
      return NextResponse.json({ error: fetchError instanceof Error ? fetchError.message : 'An error occurred' }, { status: 500 });
    }
    
    // Only check status if skipStatusCheck is false
    if (!skipStatusCheck && quotation.status === 'rejected') {
      console.log(`Reject route - Cannot reject quotation with status: ${quotation.status}`);
      return NextResponse.json({ error: `Cannot reject quotation with status: ${quotation.status}` }, { status: 400 });
    }

    // Only update status if needed
    if (!skipStatusCheck) {
      console.log('Reject route - Updating quotation with signature:', {
        id,
        hasSignature: !!signature,
        signatureLength: signature?.length || 0,
        signaturePreview: signature?.substring(0, 50) + '...' || 'none'
      });
      
      const { error: updateError } = await supabase
        .from('quotations')
        .update({ 
          status: 'rejected',
          rejected_reason: reason,
          rejected_at: new Date().toISOString(),
          rejected_by: authUser.id,
          rejection_signature: signature
        })
        .eq('id', id);
      
      if (updateError) {
        console.log(`Reject route - Error updating quotation: ${updateError.message}`);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      
      console.log('Reject route - Quotation status updated to rejected');
      
      // Log activity
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: id,
          user_id: authUser.id,
          action: 'rejected',
          details: {
            reason: reason || null,
            rejected_by_customer_id: customerId,
            rejected_by_staff_id: authUser.id
          }
        });
    }
    
    // Skip email if explicitly requested
    if (skipEmail) {
      console.log('Reject route - Skipping email notification as requested');
      return NextResponse.json({ 
        message: 'Quotation rejected, email notification skipped' 
      }, { status: 200 });
    }
    
    // Check if quotation already has a recent rejection email
    const lastEmailSent = new Date((quotation as any).last_email_sent_at || 0);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (quotation.status === 'rejected' && lastEmailSent > fiveMinutesAgo) {
      console.log('Reject route - Skipping duplicate email, one was sent recently');
      return NextResponse.json({ 
        message: 'Quotation already rejected, avoiding duplicate email notification'
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
      console.log(`Reject route - Error fetching full quotation: ${fetchError?.message || 'Quotation not found'}`);
      return NextResponse.json({ 
        message: 'Quotation rejected, but failed to send notification email',
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
      // Fetch the updated quotation to get the signature
      const { data: updatedQuotation } = await supabase
        .from('quotations')
        .select('*, quotation_items (*)')
        .eq('id', id)
        .single();
      
      // Generate optimized PDF using the new generator
      pdfBuffer = await generateOptimizedQuotationPDF(
        updatedQuotation || fullQuotation, 
        'en', 
        selectedPackage, 
        selectedPromotion
      );
      
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
      // Detect environment and use appropriate URL
      let appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) {
        // Fallback based on environment
        if (process.env.NODE_ENV === 'production') {
          appUrl = 'https://driver-companion.vercel.app';
        } else if (process.env.NODE_ENV === 'development') {
          appUrl = 'http://localhost:3000';
        } else {
          appUrl = 'https://driver-companion.vercel.app'; // Default to production
        }
      }
      
      // Format quotation ID
      const formattedQuotationId = `QUO-JPDR-${fullQuotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
      
      // Use simple subject like other emails
      const emailSubject = `Your Quotation has been Rejected - ${formattedQuotationId}`;
      
      // Customer name with fallback
      const customerName = (fullQuotation.customers ? fullQuotation.customers.name : null) || 
                         fullQuotation.customer_name || 
                         'Customer';
      
      // Generate styled email HTML with team-specific footer
      const emailHtml = generateEmailHtml('en', customerName, formattedQuotationId, fullQuotation, appUrl, reason, fullQuotation.team_location || 'thailand');
      
      // Parse BCC emails
      const bccEmailList = bcc_emails.split(',').map((email: string) => email.trim()).filter((email: string) => email);
      
      // Send email with timeout
      console.log('🔄 [REJECT ROUTE] Sending rejection email via Resend...');
      const emailSendPromise = resend.emails.send({
        from: `Driver Japan <booking@${emailDomain}>`,
        to: [emailAddress],
        bcc: bccEmailList,
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
        console.error('❌ [REJECT ROUTE] Error reported by Resend:', JSON.stringify(resendError, null, 2));
        throw new Error(`Resend API Error: ${resendError.message || 'Unknown error'}`); 
      }
      
      const emailId = emailData?.id || 'unknown';
      console.log(`Reject route - Email sent successfully! ID: ${emailId}`);
      
      // Update last_email_sent_at
      await supabase
        .from('quotations')
        .update({ 
          last_email_sent_at: new Date().toISOString() 
        } as any)
        .eq('id', id);
      
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        message: 'Quotation rejected and notification email sent', 
        emailId: emailId 
      }, { status: 200 });
    } catch (emailError) {
      console.error('❌ [REJECT ROUTE] Email sending error:', emailError);
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        message: 'Quotation rejected, but failed to send notification email',
        error: emailError instanceof Error ? emailError.message : 'Unknown email error',
        code: 'EMAIL_SEND_ERROR',
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }
  } catch (error) {
    console.error('❌ [REJECT ROUTE] Unexpected error:', error);
    clearTimeout(timeoutId);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    console.log('==================== REJECT ROUTE END ====================');
  }
} 