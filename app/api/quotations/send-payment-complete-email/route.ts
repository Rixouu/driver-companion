import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator';
import { Quotation, PricingPackage, PricingPromotion } from '@/types/quotations';
import { getTeamFooterHtml } from '@/lib/team-addresses';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

// Helper function to generate payment completion email HTML (copied from approve route)
function generateEmailHtml(language: string, customerName: string, formattedQuotationId: string, quotation: any, appUrl: string, paymentDetails?: any) {
  const isJapanese = language === 'ja';
  
  const translations = {
    en: {
      subject: 'Payment Complete - Thank You!',
      greeting: 'Hello',
      paymentComplete: 'Your payment has been completed successfully.',
      viewDetails: 'View Quotation Details',
      thankyou: 'Thank you for your payment.',
      regards: 'Best regards,',
      company: 'Driver (Thailand) Company Limited',
      paymentLabel: 'Payment Details:',
      additionalInfo: 'From your online quote you can view all details, print, or contact us with any questions.',
      closing: 'We look forward to providing you with excellent service.'
    },
    ja: {
      subject: 'お支払い完了 - ありがとうございます！',
      greeting: 'こんにちは',
      paymentComplete: 'お支払いが正常に完了いたしました。',
      viewDetails: '見積書の詳細を確認する',
      thankyou: 'お支払いありがとうございます。',
      regards: '敬具',
      company: 'Driver (Thailand) Company Limited',
      paymentLabel: '支払い詳細:',
      additionalInfo: 'オンライン見積もりから、詳細確認、印刷、お問い合わせができます。',
      closing: '素晴らしいサービスをご提供できることを楽しみにしております。'
    }
  };
  
  const t = translations[language as 'en' | 'ja'] || translations.en;
  
  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${isJapanese ? 'お支払い完了' : 'Payment Complete'}</title>
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
          background-color: #E03E2D;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          display: inline-block;
          margin: 16px 0;
        }
        .payment-info {
          background-color: #f0fdf4;
          border-left: 4px solid #059669;
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
                    ${isJapanese ? 'お支払い完了' : 'Payment Complete'}
                  </h1>
                  <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                    ${isJapanese ? '請求書番号' : 'Invoice'} #${formattedQuotationId}
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding:32px 24px;">
                  <div class="greeting">
                    <p>${isJapanese ? 'こんにちは' : 'Hello'} ${customerName},</p>
                    
                    <p>${isJapanese ? 'お支払いが正常に完了いたしました。' : 'Your payment has been completed successfully.'}</p>
                    
                    <p>${isJapanese ? '請求書と領収書を添付いたします。' : 'Please find the invoice and receipt attached to this email.'}</p>
                    
                    <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
                      <h3 style="margin:0 0 12px 0; color:#32325D;">${isJapanese ? '請求書詳細' : 'Invoice Details'}</h3>
                      <p style="margin:0; color:#525f7f;">
                        <strong>${isJapanese ? '請求書ID:' : 'Invoice ID:'}</strong> ${formattedQuotationId}<br>
                        <strong>${isJapanese ? 'タイトル:' : 'Title:'}</strong> ${quotation.title || (isJapanese ? '無題' : 'Untitled')}<br>
                        <strong>${isJapanese ? '合計金額:' : 'Total Amount:'}</strong> ${quotation.currency || 'JPY'} ${quotation.total_amount?.toLocaleString() || '0'}<br>
                        <strong>${isJapanese ? 'ステータス:' : 'Status:'}</strong> <span style="color:#059669; font-weight:600;">${isJapanese ? '支払い完了' : 'Payment Complete'}</span><br>
                        <strong>${isJapanese ? '日付:' : 'Date:'}</strong> ${new Date().toLocaleDateString()}
                      </p>
                    </div>
                    
                    ${paymentDetails ? `
                      <div class="payment-info">
                        <h4 style="margin:0 0 8px 0; color:#32325D;">${isJapanese ? '支払い詳細:' : 'Payment Details:'}</h4>
                        <p style="margin:0; color:#525f7f;">                        <p style="margin:0; color:#525f7f;">
                          <strong>${isJapanese ? '支払い方法:' : 'Payment Method:'}</strong> ${paymentDetails.method}<br>
                          <strong>${isJapanese ? '支払い金額:' : 'Payment Amount:'}</strong> ${quotation.currency || 'JPY'} ${paymentDetails.amount?.toLocaleString() || '0'}<br>
                          <strong>${isJapanese ? '支払い日:' : 'Payment Date:'}</strong> ${paymentDetails.date}
                        </p>
                      </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin:20px 0;">
                      <a href="${appUrl}/quotations/${quotation.id}"
                         style="display:inline-block; padding:12px 24px; background:#E03E2D; color:#FFF;
                                text-decoration:none; border-radius:4px; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif;
                                font-size:16px; font-weight:600; text-align: center;">
                        ${t.viewDetails}
                      </a>
                    </div>
                    
                    <p>${isJapanese ? 'お支払いが完了いたしました。これでサービスをご利用いただけます。' : 'Your payment has been completed. You can now proceed with your service.'}</p>
                    
                    <p>${isJapanese ? 'お支払いありがとうございます！' : 'Thank you for your payment!'}</p>
                    
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; font-size:12px; color:#8898AA;">
                  ${getTeamFooterHtml(quotation.team_location || 'thailand', language === 'ja')}
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
  console.log('==================== PAYMENT COMPLETE EMAIL ROUTE START ====================');
  
  // Set up timeout for the entire request (45 seconds)
  const timeoutId = setTimeout(() => {
    console.error('❌ [PAYMENT COMPLETE EMAIL ROUTE] Request timeout after 45 seconds');
  }, 45000);
  
  try {
    console.log('Payment complete email route - Parsing request body');
    const { quotation_id, language = 'en', bcc_emails = 'booking@japandriver.com' } = await request.json();
    
    console.log(`Payment complete email route - Request data: quotation_id=${quotation_id}, language=${language}`);
    
    if (!quotation_id) {
      console.log('Payment complete email route - Missing quotation ID');
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }
    
    // Get translations
    console.log('Payment complete email route - Getting translations');
    const { t } = await getDictionary();

    // Create server client (relies on cookies for auth)
    console.log('Payment complete email route - Creating Supabase server client');
    let supabase;
    try {
      supabase = await getSupabaseServerClient();
      console.log('Payment complete email route - Supabase server client created successfully');
    } catch (serverClientError) {
      console.error('Payment complete email route - Error creating server client:', serverClientError);
      return NextResponse.json(
        { error: 'Error connecting to database' },
        { status: 500 }
      );
    }

    // Authenticate user (staff member sending the email)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      console.error('Payment complete email route - Authentication error', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Payment complete email route - User authenticated:', authUser.id);

    // Fetch the quotation with customer details
    console.log(`Payment complete email route - Fetching quotation with ID: ${quotation_id}`);
    let quotation;
    try {
      const { data, error: fetchError } = await supabase
        .from('quotations')
        .select('*, customers(*), quotation_items (*)')
        .eq('id', quotation_id)
        .single();
      
      if (fetchError || !data) {
        console.log(`Payment complete email route - Error fetching quotation: ${fetchError?.message || 'Quotation not found'}`);
        return NextResponse.json({ error: fetchError?.message || 'Quotation not found' }, { status: 404 });
      }
      
      quotation = data as Quotation;
      console.log(`Payment complete email route - Quotation fetched successfully. ID: ${quotation.id}, Status: ${quotation.status}, Quote Number: ${quotation.quote_number}`);
    } catch (fetchError) {
      console.error('Payment complete email route - Error fetching quotation:', fetchError);
      return NextResponse.json({ error: fetchError instanceof Error ? fetchError.message : 'An error occurred' }, { status: 500 });
    }
    
    // Ensure we have a valid email address before proceeding
    const emailAddress = quotation.customer_email || 
                      (quotation.customers ? quotation.customers.email : null);
    
    if (!emailAddress) {
      console.log('Payment complete email route - No valid email address found for this quotation');
      return NextResponse.json({ 
        message: 'No valid email address found',
        error: 'Missing email address'
      }, { status: 400 });
    }
    
    // Fetch associated package and promotion for the PDF
    let selectedPackage: PricingPackage | null = null;
    const packageId = (quotation as any).selected_package_id || (quotation as any).package_id || (quotation as any).pricing_package_id;
    if (packageId) {
        const { data: pkg } = await supabase.from('pricing_packages').select('*, items:pricing_package_items(*)').eq('id', packageId).single();
        selectedPackage = pkg as PricingPackage | null;
    }

    let selectedPromotion: PricingPromotion | null = null;
    const promotionCode = (quotation as any).selected_promotion_code || (quotation as any).promotion_code;
    if (promotionCode) {
        const { data: promo } = await supabase.from('pricing_promotions').select('*').eq('code', promotionCode).single();
        selectedPromotion = promo as PricingPromotion | null;
    }
    
          // Generate invoice PDF for attachment (not quotation)
      console.log('Payment complete email route - Generating invoice PDF for email attachment');
      let pdfBuffer;
      try {
        // Fetch the updated quotation to get the latest status
        const { data: updatedQuotation } = await supabase
          .from('quotations')
          .select('*, quotation_items (*)')
          .eq('id', quotation_id)
          .single();
        
        // Generate optimized PDF using the existing generator (this will create an invoice-style PDF)
        pdfBuffer = await generateOptimizedQuotationPDF(
          updatedQuotation || quotation, 
          language as 'en' | 'ja', 
          selectedPackage, 
          selectedPromotion
        );
        
        console.log('Payment complete email route - Invoice PDF generated successfully');
      } catch (pdfError) {
        console.error('Payment complete email route - Invoice PDF generation error:', pdfError);
        return NextResponse.json({ 
          message: 'Failed to generate invoice PDF for email', 
          error: pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'
        }, { status: 500 });
      }
    
    // Send email notification
    try {
      console.log(`Payment complete email route - Sending payment completion email to: ${emailAddress}`);
      
      // Check if API key is configured
      if (!process.env.RESEND_API_KEY) {
        console.error('Payment complete email route - RESEND_API_KEY environment variable is not configured');
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
      let appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) {
        if (process.env.NODE_ENV === 'production') {
          appUrl = 'https://driver-companion.vercel.app';
        } else if (process.env.NODE_ENV === 'development') {
          appUrl = 'http://localhost:3000';
        } else {
          appUrl = 'https://driver-companion.vercel.app';
        }
      }
      
      // Format quotation ID
      const formattedQuotationId = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
      
      // Email subject
      const emailSubject = language === 'ja' 
        ? `お支払い完了 - ありがとうございます！ - ${formattedQuotationId}`
        : `Payment Complete - Thank You! - ${formattedQuotationId}`;
      
      // Customer name with fallback
      const customerName = (quotation.customers ? quotation.customers.name : null) || 
                         quotation.customer_name || 
                         'Customer';
      
      // Payment details for the email
      const paymentDetails = {
        method: (quotation as any).payment_method || 'Not specified',
        amount: (quotation as any).payment_amount || quotation.total_amount,
        date: (quotation as any).payment_date || (quotation as any).payment_completed_at ? 
              new Date((quotation as any).payment_completed_at).toLocaleDateString() : 
              new Date().toLocaleDateString()
      };
      
      // Generate styled email HTML using our helper function
      const emailHtml = generateEmailHtml(language as 'en' | 'ja', customerName, formattedQuotationId, quotation, appUrl, paymentDetails);
      
      // Parse BCC emails
      const bccEmailList = bcc_emails.split(',').map((email: string) => email.trim()).filter((email: string) => email);
      
      // Prepare attachments (invoice + receipt if available)
      const attachments = [];
      
      // Add invoice PDF
      if (pdfBuffer) {
        attachments.push({
          filename: `INV-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}-payment-complete.pdf`,
          content: pdfBuffer.toString('base64')
        });
      }
      
      // Add receipt if available
      if (quotation.receipt_url) {
        try {
          console.log('🔄 [PAYMENT COMPLETE EMAIL ROUTE] Fetching receipt from URL:', quotation.receipt_url);
          const receiptResponse = await fetch(quotation.receipt_url);
          if (receiptResponse.ok) {
            const receiptBuffer = await receiptResponse.arrayBuffer();
            const receiptBase64 = Buffer.from(receiptBuffer).toString('base64');
            
            // Extract filename from URL or use default
            const urlParts = quotation.receipt_url.split('/');
            const filename = urlParts[urlParts.length - 1] || `receipt-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}.pdf`;
            
            attachments.push({
              filename: filename,
              content: receiptBase64
            });
            console.log('✅ [PAYMENT COMPLETE EMAIL ROUTE] Receipt added to attachments');
          } else {
            console.log('⚠️ [PAYMENT COMPLETE EMAIL ROUTE] Could not fetch receipt, skipping attachment');
          }
        } catch (receiptError) {
          console.log('⚠️ [PAYMENT COMPLETE EMAIL ROUTE] Error fetching receipt:', receiptError);
        }
      }

      // Send email with timeout
      console.log('🔄 [PAYMENT COMPLETE EMAIL ROUTE] Sending payment completion email via Resend...');
      const emailSendPromise = resend.emails.send({
        from: `Driver Japan <booking@${emailDomain}>`,
        to: [emailAddress],
        bcc: bccEmailList,
        subject: emailSubject,
        html: emailHtml,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      // Add timeout for email sending (30 seconds)
      const { data: emailData, error: resendError } = await Promise.race([
        emailSendPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000)
        )
      ]);

      if (resendError) {
        console.error('❌ [PAYMENT COMPLETE EMAIL ROUTE] Error reported by Resend:', JSON.stringify(resendError, null, 2));
        throw new Error(`Resend API Error: ${resendError.message || 'Unknown error'}`); 
      }
      
      const emailId = emailData?.id || 'unknown';
      console.log(`Payment complete email route - Email sent successfully! ID: ${emailId}`);
      
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        message: 'Payment completion email sent successfully', 
        emailId: emailId 
      }, { status: 200 });
    } catch (emailError) {
      console.error('❌ [PAYMENT COMPLETE EMAIL ROUTE] Email sending error:', emailError);
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        message: 'Failed to send payment completion email',
        error: emailError instanceof Error ? emailError.message : 'Unknown email error',
        code: 'EMAIL_SEND_ERROR',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ [PAYMENT COMPLETE EMAIL ROUTE] Unexpected error:', error);
    clearTimeout(timeoutId);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    console.log('==================== PAYMENT COMPLETE EMAIL ROUTE END ====================');
  }
}
