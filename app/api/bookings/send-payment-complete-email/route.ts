import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/main";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator';
import { Quotation, PricingPackage, PricingPromotion } from '@/types/quotations';
import { getTeamFooterHtml } from '@/lib/team-addresses';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

// Helper function to generate payment completion email HTML (EXACT COPY from quotation route)
function generateEmailHtml(language: string, customerName: string, formattedBookingId: string, booking: any, appUrl: string, paymentDetails?: any) {
  const isJapanese = language === 'ja';
  
  const translations = {
    en: {
      subject: 'Payment Complete - Thank You!',
      greeting: 'Hello',
      paymentComplete: 'Your payment has been completed successfully.',
      viewDetails: 'View Booking Details',
      thankyou: 'Thank you for your payment.',
      regards: 'Best regards,',
      company: 'Driver (Thailand) Company Limited',
      paymentLabel: 'Payment Details:',
      additionalInfo: 'From your online booking you can view all details, print, or contact us with any questions.',
      closing: 'We look forward to providing you with excellent service.'
    },
    ja: {
      subject: 'お支払い完了 - ありがとうございます！',
      greeting: 'こんにちは',
      paymentComplete: 'お支払いが正常に完了いたしました。',
      viewDetails: '予約の詳細を確認する',
      thankyou: 'お支払いありがとうございます。',
      regards: '敬具',
      company: 'Driver (Thailand) Company Limited',
      paymentLabel: '支払い詳細:',
      additionalInfo: 'オンライン予約から、詳細確認、印刷、お問い合わせができます。',
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
                    ${isJapanese ? '予約番号' : 'Booking'} #${formattedBookingId}
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
                      <h3 style="margin:0 0 12px 0; color:#32325D;">${isJapanese ? '予約詳細' : 'Booking Details'}</h3>
                      <p style="margin:0; color:#525f7f;">
                        <strong>${isJapanese ? '予約ID:' : 'Booking ID:'}</strong> ${formattedBookingId}<br>
                        <strong>${isJapanese ? 'サービス:' : 'Service:'}</strong> ${booking.service_name || (isJapanese ? '空港送迎' : 'Airport Transfer')}<br>
                         <strong>${isJapanese ? '合計金額:' : 'Total Amount:'}</strong> ${booking.price?.currency || booking.price_currency || 'JPY'} ${(booking.price?.amount || booking.price_amount || 0).toLocaleString()}<br>
                        <strong>${isJapanese ? 'ステータス:' : 'Status:'}</strong> <span style="color:#059669; font-weight:600;">${isJapanese ? '支払い完了' : 'Payment Complete'}</span><br>
                        <strong>${isJapanese ? '日付:' : 'Date:'}</strong> ${new Date().toLocaleDateString()}
                      </p>
                    </div>
                    
                    ${paymentDetails ? `
                      <div class="payment-info">
                        <h4 style="margin:0 0 8px 0; color:#32325D;">${isJapanese ? '支払い詳細:' : 'Payment Details:'}</h4>
                        <p style="margin:0; color:#525f7f;">
                          <strong>${isJapanese ? '支払い方法:' : 'Payment Method:'}</strong> ${paymentDetails.method}<br>
                          <strong>${isJapanese ? '支払い金額:' : 'Payment Amount:'}</strong> ${booking.price?.currency || 'JPY'} ${(paymentDetails.amount || 0).toLocaleString()}<br>
                          <strong>${isJapanese ? '支払い日:' : 'Payment Date:'}</strong> ${paymentDetails.date}
                        </p>
                      </div>
                    ` : ''}
                    
                    <!-- Removed View Booking Details button - customers don't have access to booking page -->
                    
                    <p>${isJapanese ? 'お支払いが完了いたしました。これでサービスをご利用いただけます。' : 'Your payment has been completed. You can now proceed with your service.'}</p>
                    
                    <p>${isJapanese ? 'お支払いありがとうございます！' : 'Thank you for your payment!'}</p>
                    
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; font-size:12px; color:#8898AA;">
                  ${getTeamFooterHtml(booking.team_location || 'thailand', language === 'ja')}
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
  console.log('==================== BOOKING PAYMENT COMPLETE EMAIL ROUTE START ====================');
  
  // Set up timeout for the entire request (45 seconds)
  const timeoutId = setTimeout(() => {
    console.error('❌ [BOOKING PAYMENT COMPLETE EMAIL ROUTE] Request timeout after 45 seconds');
  }, 45000);
  
  try {
    console.log('Booking payment complete email route - Parsing request body');
    const { booking_id, language = 'en', bcc_emails = 'booking@japandriver.com' } = await request.json();
    
    console.log(`Booking payment complete email route - Request data: booking_id=${booking_id}, language=${language}`);
    
    if (!booking_id) {
      console.log('Booking payment complete email route - Missing booking ID');
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }
    
    // Get translations
    console.log('Booking payment complete email route - Getting translations');
    const { t } = await getDictionary();

    // Create server client (relies on cookies for auth)
    console.log('Booking payment complete email route - Creating Supabase server client');
    let supabase;
    try {
      supabase = await getSupabaseServerClient();
      console.log('Booking payment complete email route - Supabase server client created successfully');
    } catch (serverClientError) {
      console.error('Booking payment complete email route - Error creating server client:', serverClientError);
      return NextResponse.json(
        { error: 'Error connecting to database' },
        { status: 500 }
      );
    }

    // Authenticate user (staff member sending the email)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      console.error('Booking payment complete email route - Authentication error', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Booking payment complete email route - User authenticated:', authUser.email);

    // Get booking data
    console.log('Booking payment complete email route - Fetching booking data');
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (
          name,
          email
        )
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('Booking payment complete email route - Booking not found:', bookingError);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log('Booking payment complete email route - Booking found:', booking.id);

    // Get customer information
    const customerName = booking.customer_name || booking.customers?.name || 'Customer';
    const customerEmail = booking.customer_email || booking.customers?.email;
    
    if (!customerEmail) {
      console.error('Booking payment complete email route - No customer email found');
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      );
    }

    console.log('Booking payment complete email route - Customer info:', { customerName, customerEmail });

    // Format booking ID using wp_id
    const formattedBookingId = booking.wp_id || `BOO-${booking.id.substring(0, 8).toUpperCase()}`;
    
    // Get payment details from booking meta and price
    const paymentDetails = {
      amount: booking.meta?.payment_amount || booking.price?.amount,
      method: booking.meta?.payment_method || 'Online Payment',
      date: booking.meta?.payment_completed_at ? new Date(booking.meta.payment_completed_at).toLocaleDateString() : new Date().toLocaleDateString()
    };

    // Generate email content
    console.log('Booking payment complete email route - Generating email content');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
    const emailHtml = generateEmailHtml(
      language,
      customerName,
      formattedBookingId,
      booking,
      appUrl,
      paymentDetails
    );

    // Prepare email data
    const emailSubject = language === 'ja' 
      ? `お支払い完了 - ありがとうございます！ - ${formattedBookingId}`
      : `Payment Complete - Thank You! - ${formattedBookingId}`;

    const emailData = {
      from: 'Driver Japan <booking@japandriver.com>',
      to: [customerEmail],
      subject: emailSubject,
      html: emailHtml,
    };

    // Parse BCC emails
    const bccEmailList = bcc_emails.split(',').map((email: string) => email.trim()).filter((email: string) => email);

      // Generate invoice PDF for attachment using the proper booking invoice generator
      console.log('Booking payment complete email route - Generating invoice PDF for email attachment');
      let pdfBuffer;
      try {
        // Get the base URL for the current request
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                       process.env.NODE_ENV === 'production' ? 'https://japandriver.com' :
                       'http://localhost:3000';
        
        // Call the dedicated booking invoice PDF generator
        const invoiceResponse = await fetch(`${baseUrl}/api/bookings/generate-invoice-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: booking.id,
            language: language
          })
        });

        if (!invoiceResponse.ok) {
          const errorText = await invoiceResponse.text();
          console.error('Invoice PDF generation failed:', errorText);
          throw new Error(`Failed to generate invoice PDF: ${invoiceResponse.status} ${invoiceResponse.statusText}`);
        }

        pdfBuffer = await invoiceResponse.arrayBuffer();
      
      console.log('Booking payment complete email route - Invoice PDF generated successfully');
    } catch (pdfError) {
      console.error('Booking payment complete email route - Invoice PDF generation error:', pdfError);
      // Don't fail the request if PDF can't be generated
    }

    // Prepare attachments (invoice + receipt if available)
    const attachments = [];
    
    // Add invoice PDF
    if (pdfBuffer) {
      attachments.push({
        filename: `INV-${formattedBookingId}-payment-complete.pdf`,
        content: Buffer.from(pdfBuffer).toString('base64')
      });
    }
    
    // Add receipt if available
    if (booking.receipt_url) {
      try {
        console.log('🔄 [BOOKING PAYMENT COMPLETE EMAIL ROUTE] Fetching receipt from URL:', booking.receipt_url);
        const receiptResponse = await fetch(booking.receipt_url);
        if (receiptResponse.ok) {
          const receiptBuffer = await receiptResponse.arrayBuffer();
          const receiptBase64 = Buffer.from(receiptBuffer).toString('base64');
          
          // Extract filename from URL or use default
          const urlParts = booking.receipt_url.split('/');
          const filename = urlParts[urlParts.length - 1] || `receipt-BK-${booking.id.substring(0, 8).toUpperCase()}.pdf`;
          
          attachments.push({
            filename: filename,
            content: receiptBase64
          });
          console.log('✅ [BOOKING PAYMENT COMPLETE EMAIL ROUTE] Receipt added to attachments');
        } else {
          console.log('⚠️ [BOOKING PAYMENT COMPLETE EMAIL ROUTE] Could not fetch receipt, skipping attachment');
        }
      } catch (receiptError) {
        console.log('⚠️ [BOOKING PAYMENT COMPLETE EMAIL ROUTE] Error fetching receipt:', receiptError);
      }
    }

    // Initialize Resend with API key
    const resendClient = new Resend(process.env.RESEND_API_KEY);
    
    // Send email using Resend
    const { data: resendData, error: resendError } = await Promise.race([
      resendClient.emails.send({
        ...emailData,
        bcc: bccEmailList.length > 0 ? bccEmailList : undefined,
        attachments: attachments.length > 0 ? attachments : undefined
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000)
      )
    ]);

    if (resendError) {
      console.error('❌ [BOOKING PAYMENT COMPLETE EMAIL ROUTE] Error reported by Resend:', JSON.stringify(resendError, null, 2));
      throw new Error(`Resend API Error: ${resendError.message || 'Unknown error'}`); 
    }
    
    const emailId = resendData?.id || 'unknown';
    console.log(`Booking payment complete email route - Email sent successfully! ID: ${emailId}`);
    
    clearTimeout(timeoutId);
    return NextResponse.json({ 
      message: 'Booking payment completion email sent successfully', 
      emailId: emailId 
    }, { status: 200 });
  } catch (error) {
    console.error('❌ [BOOKING PAYMENT COMPLETE EMAIL ROUTE] Unexpected error:', error);
    clearTimeout(timeoutId);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    console.log('==================== BOOKING PAYMENT COMPLETE EMAIL ROUTE END ====================');
  }
}
