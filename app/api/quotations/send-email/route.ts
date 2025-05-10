import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { Resend } from 'resend'
// Remove jsPDF dependency - we're using Puppeteer now
// Import our new HTML PDF generator
import { generatePdfFromHtml, generateQuotationHtml } from '@/lib/html-pdf-generator'
// Import the new PDF helper utilities
import { embedWorkSansFont, formatCurrency, createQuotationHeader } from '@/lib/pdf-helpers'

console.log('✅ [SEND-EMAIL API] Module loaded, imports successful.'); // Log after imports

// Email templates for different languages
const emailTemplates = {
  en: {
    subject: 'Your Quotation from Driver',
    greeting: 'Hello',
    intro: 'Thank you for your interest in our services. Please find attached your quotation.',
    followup: 'If you have any questions or would like to proceed with this quotation, please click in the button below.',
    additionalInfo: 'From your online quote you can accept, decline, comment or print.',
    callToAction: 'View Your Quotation Online',
    closing: 'We look forward to working with you.',
    regards: 'Best regards,',
    company: 'Driver (Thailand) Company Limited',
    serviceDetails: 'SERVICE DETAILS',
    pricingDetails: 'PRICING DETAILS'
  },
  ja: {
    subject: 'ドライバーからの見積書',
    greeting: 'こんにちは',
    intro: '弊社サービスにご興味をお持ちいただき、ありがとうございます。ご依頼いただいた見積書を添付にてお送りいたします。',
    followup: 'ご質問がございましたら、またはこの見積もりを承諾される場合は、以下のボタンをクリックしてください。',
    additionalInfo: 'オンライン見積もりから、承諾、辞退、コメント、印刷ができます。',
    callToAction: 'オンラインで見積書を確認',
    closing: 'よろしくお願いいたします。',
    regards: '敬具',
    company: 'Driver (Thailand) Company Limited',
    serviceDetails: 'サービス詳細',
    pricingDetails: '価格詳細'
  }
};

// Function to generate custom PDF using HTML-to-PDF approach
async function generateQuotationPDF(quotation: any, language: string): Promise<Buffer | null> {
  console.log(`🔄 [SEND-EMAIL API] Entering generateQuotationPDF for quote: ${quotation?.id}, lang: ${language}`);
  
  try {
    console.log('🔄 [SEND-EMAIL API] Starting PDF generation with HTML-to-PDF');
    
    // Generate the HTML for the quotation
    const htmlContent = generateQuotationHtml(quotation, language as 'en' | 'ja');
    
    // Convert the HTML to a PDF
    const pdfBuffer = await generatePdfFromHtml(htmlContent, {
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true
    });
    
    console.log('✅ [SEND-EMAIL API] PDF generation successful!');
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ [SEND-EMAIL API] Error during PDF generation:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 [SEND-EMAIL API] Received POST request.'); // Log entry into POST
  try {
    // Use formData to handle the multipart/form-data request
    const formData = await request.formData();
    
    const email = formData.get('email') as string;
    const quotationId = formData.get('quotation_id') as string;
    const language = (formData.get('language') as string) || 'en';
    
    console.log('🔄 [SEND-EMAIL API] Received request for quotation:', quotationId);
    
    if (!email || !quotationId) {
      console.error('❌ [SEND-EMAIL API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create service client (doesn't rely on cookies)
    console.log('🔄 [SEND-EMAIL API] Creating Supabase service client');
    let supabase;
    try {
      supabase = createServiceClient();
      console.log('✅ [SEND-EMAIL API] Supabase service client created successfully');
    } catch (serviceClientError) {
      console.error('❌ [SEND-EMAIL API] Error creating service client:', serviceClientError);
      return NextResponse.json(
        { error: 'Error connecting to database' },
        { status: 500 }
      );
    }
    
    // Always fetch the latest quotation data
    console.log('🔄 [SEND-EMAIL API] Fetching latest quotation data');
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*, customers (*)') // Include customer data if needed for billing/info
      .eq('id', quotationId)
      .single();
    
    if (error || !quotation) {
      console.error('❌ [SEND-EMAIL API] Error fetching quotation data:', error);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ [SEND-EMAIL API] Found quotation:', { id: quotation.id, email: quotation.customer_email });
    
    // Generate a fresh PDF from the latest data using the new function
    console.log(`🔄 [SEND-EMAIL API] Calling generateQuotationPDF for quote: ${quotation.id}, lang: ${language}`); // Log before calling
    
    // Call the integrated PDF generation function
    const pdfBuffer = await generateQuotationPDF(quotation, language);
    
    if (!pdfBuffer) {
      console.error('❌ [SEND-EMAIL API] Failed to generate PDF');
      return NextResponse.json(
        { error: 'Failed to generate PDF attachment' },
        { status: 500 }
      );
    }
    
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ [SEND-EMAIL API] RESEND_API_KEY environment variable is not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }
    
    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Get email domain from env or fallback
    const emailDomain = (process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com').replace(/%$/, '');
    
    // Get the public URL for the Driver logo (needed for email body, not PDF)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
    
    // Format quotation ID to use JPDR prefix
    const formattedQuotationId = `JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
    
    // Determine if this is an updated quotation
    const isUpdated = quotation.status === 'sent';
    
    // Create email content with appropriate subject line
    const subjectPrefix = isUpdated ? 
      (language === 'ja' ? '更新した見積書' : 'Your Updated Quotation') : 
      (language === 'ja' ? 'ドライバーからの見積書' : 'Your Quotation');
    
    const emailSubject = `${subjectPrefix} - ${formattedQuotationId}`;
    
    // Format the customer name nicely
    const customerName = quotation.customer_name || email.split('@')[0];
    
    // Create the email content using existing helper functions
    const emailHtml = generateEmailHtml(language, customerName, formattedQuotationId, quotation, appUrl, isUpdated);
    const textContent = generateEmailText(language, customerName, formattedQuotationId, quotation, appUrl, isUpdated);
    
    console.log('🔄 [SEND-EMAIL API] Sending email with PDF attachment');
    
    try {
      const { data: emailData, error: resendError } = await resend.emails.send({
        from: `Driver Japan <booking@${emailDomain}>`,
        to: [email],
        subject: emailSubject,
        text: textContent,
        html: emailHtml,
        attachments: [{
          filename: `quotation-${formattedQuotationId}.pdf`,
          content: pdfBuffer.toString('base64') // Ensure content is base64 encoded
        }]
      });
    
      if (resendError) {
        // Enhanced logging for Resend errors
        console.error('❌ [SEND-EMAIL API] Error reported by Resend:', JSON.stringify(resendError, null, 2));
        // Rethrow the specific Resend error for clearer debugging upstream if needed
        throw new Error(`Resend API Error: ${resendError.message || 'Unknown error'}`); 
      }
      
      console.log('✅ [SEND-EMAIL API] Email sent successfully! ID:', emailData?.id);
      
      // Update quotation status to 'sent' and last_sent details
      await supabase
        .from('quotations')
        .update({ 
          status: 'sent',
          last_sent_at: new Date().toISOString(),
          last_sent_to: email,
          // Update expiry date to 30 days from now (or keep existing logic if preferred)
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', quotationId);
    
      // Log activity
      const userId = '00000000-0000-0000-0000-000000000000'; // System user for emails
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: quotationId,
          user_id: userId,
          action: 'email_sent',
          details: { 
            email: email,
            sent_at: new Date().toISOString(),
            sent_by: 'system'
          }
        });
      
      return NextResponse.json({ 
        success: true,
        message: 'Email sent successfully',
        emailId: emailData?.id 
      });
      
    } catch (err) {
      // Log the specific error type and message
      console.error(`❌ [SEND-EMAIL API] Error during email sending process: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`);
      // Log the stack trace if available
      if (err instanceof Error && err.stack) {
          console.error('Stack trace:', err.stack);
      }
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Failed to send email' },
        { status: 500 }
      );
    }
    
  } catch (err) {
    // Simplified catch block for broader logging
    console.error('❌ [SEND-EMAIL API] Unhandled error in POST handler:', err);
    // Log stack trace if available
    if (err instanceof Error && err.stack) {
        console.error('[SEND-EMAIL API] POST Handler Stack Trace:', err.stack);
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred in POST handler' },
      { status: 500 }
    );
  }
}

// Helper function to generate email HTML content
function generateEmailHtml(language: string, customerName: string, formattedQuotationId: string, quotation: any, appUrl: string, isUpdated: boolean = false) {
  const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
  const isJapanese = language === 'ja';
    
  // Format quotation details for display
  const serviceType = quotation.service_type || 'Transportation Service';
  const vehicleType = quotation.vehicle_type || 'Standard Vehicle';
  const hours = quotation.duration_hours || quotation.hours_per_day || 8;
  const serviceDays = quotation.service_days || quotation.number_of_days || quotation.duration_days || 1;
  const durationUnit = isJapanese ? '時間' : 'hours';
  
  // Format pricing information
  const formatCurrency = (amount: number) => {
    const currency = quotation?.display_currency || quotation?.currency || 'JPY';
    if (!amount) return currency === 'JPY' ? `¥0` : `${currency} 0`;
    
    // Exchange rates (simplified for demo)
    const exchangeRates: Record<string, number> = {
      'JPY': 1,
      'USD': 0.0067,
      'EUR': 0.0062,
      'THB': 0.22,
      'CNY': 0.048,
      'SGD': 0.0091
    };

    // Convert amount from JPY to selected currency
    const originalCurrency = quotation?.currency || 'JPY';
    const convertedAmount = amount * (exchangeRates[currency] / exchangeRates[originalCurrency]);
    
    // Format based on currency
    if (currency === 'JPY' || currency === 'CNY') {
      return currency === 'JPY' 
        ? `¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (currency === 'THB') {
      return `฿${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(convertedAmount);
    }
  };
  
  // Recalculate values for email body display
  let hourlyRate = quotation.price_per_day || quotation.hourly_rate || quotation.daily_rate || 0;
  let baseAmount = hourlyRate * serviceDays;

  if (quotation.total_amount && baseAmount === 0) {
    const totalAmt = parseFloat(String(quotation.total_amount));
    const discPerc = quotation.discount_percentage ? parseFloat(String(quotation.discount_percentage)) : 0;
    const taxPerc = quotation.tax_percentage ? parseFloat(String(quotation.tax_percentage)) : 0;
    let calcTotal = totalAmt;
    let subtotalPreTax = calcTotal;
    if (taxPerc > 0) subtotalPreTax = calcTotal / (1 + (taxPerc / 100));
    if (discPerc > 0) baseAmount = subtotalPreTax / (1 - (discPerc / 100));
    else baseAmount = subtotalPreTax;
    // Ensure hourlyRate is updated if derived
    if (serviceDays > 0) {
        hourlyRate = baseAmount / serviceDays; 
    }
  }

  const hasDiscount = quotation.discount_percentage && parseFloat(String(quotation.discount_percentage)) > 0;
  let discountAmount = 0;
  let subtotalAmount = baseAmount;
  if (hasDiscount) {
    const discountPercentage = parseFloat(String(quotation.discount_percentage));
    discountAmount = (baseAmount * discountPercentage) / 100;
    subtotalAmount = baseAmount - discountAmount;
  }
  
  const hasTax = quotation.tax_percentage && parseFloat(String(quotation.tax_percentage)) > 0;
  let taxAmount = 0;
  let totalAmount = subtotalAmount;
  if (hasTax) {
    const taxPercentage = parseFloat(String(quotation.tax_percentage));
    taxAmount = (subtotalAmount * taxPercentage) / 100;
    totalAmount = subtotalAmount + taxAmount;
  }

  const finalAmount = quotation.total_amount ? parseFloat(String(quotation.total_amount)) : (subtotalAmount + taxAmount);
    
  // Customize greeting based on whether this is an update
  const greetingText = isUpdated
    ? (isJapanese ? '見積書が更新されました。' : 'Your quotation has been updated.')
    : (isJapanese ? 'お見積りありがとうございます。' : 'Thank you for your quotation request.');
  
  // Email HTML template
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${emailTemplates[language].subject}</title>
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
        .price-table th, .price-table td {
           padding: 10px 0;
           font-size: 14px;
        }
         .price-table th {
           color: #8898AA;
           text-transform: uppercase;
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
                          ${language === 'ja' ? 
                            `見積書${isUpdated ? '更新' : ''}` : 
                            `Your Quotation ${isUpdated ? 'Updated' : ''} from Driver`}
                        </h1>
                        <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                          ${language === 'ja' ? '見積書番号' : 'Quotation'} #${formattedQuotationId}
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
                    ${emailTemplates[language].greeting} ${customerName},<br><br>
                    ${greetingText}
                  </p>
                </td>
              </tr>
              
              <!-- SERVICE DETAILS BLOCK -->
              <tr>
                <td style="padding:12px 24px 12px;">
                  <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif; color:#32325D; text-transform: uppercase;">
                    ${isJapanese ? 'サービス概要' : 'SERVICE SUMMARY'}
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="details-table"
                        style="background:#F8FAFC; border-radius:8px;">
                    <tr>
                      <td style="padding:12px;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <th width="30%">${isJapanese ? 'サービスタイプ:' : 'SERVICE TYPE'}</th>
                            <td>${serviceType}</td>
                          </tr>
                          <tr>
                            <th>${isJapanese ? '車両:' : 'VEHICLE'}</th>
                            <td>${vehicleType}</td>
                          </tr>
                          <tr>
                            <th>${isJapanese ? '時間:' : 'HOURS'}</th>
                            <td>${hours} ${durationUnit}</td>
                          </tr>
                          ${serviceDays > 1 ? `
                          <tr>
                            <th>${isJapanese ? '日数:' : 'NUMBER OF DAYS'}</th>
                            <td>${serviceDays}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- PRICE DETAILS BLOCK (using recalculated values) -->
              <tr>
                <td style="padding:12px 24px 24px;">
                  <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif; color:#32325D; text-transform: uppercase;">
                    ${isJapanese ? '価格詳細' : 'PRICE DETAILS'}
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="price-table"
                        style="background:#F8FAFC; border-radius:8px;">
                    <tr>
                      <td style="padding:12px;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <th align="left" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                              ${isJapanese ? '内容' : 'DESCRIPTION'}
                            </th>
                            <th align="right" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                              ${isJapanese ? '価格' : 'PRICE'}
                            </th>
                          </tr>
                          <tr>
                            <td style="padding-top: 15px;">${vehicleType}</td>
                            <td align="right" style="padding-top: 15px;"></td>
                          </tr>
                          <tr>
                            <td>${isJapanese ? `時間料金 (${hours} 時間 / 日)` : `Hourly Rate (${hours} hours / day)`}</td>
                            <td align="right">${formatCurrency(hourlyRate)}</td>
                          </tr>
                          ${serviceDays > 1 ? `
                          <tr>
                            <td style="color: #666;">${isJapanese ? '日数' : 'Number of Days'}</td>
                            <td align="right">× ${serviceDays}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 500;">${isJapanese ? '基本料金' : 'Base Amount'}</td>
                            <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 500;">${formatCurrency(baseAmount)}</td>
                          </tr>
                          ${hasDiscount ? `
                          <tr>
                            <td style="color: #e53e3e;">${isJapanese ? `割引 (${quotation.discount_percentage}%)` : `Discount (${quotation.discount_percentage}%)`}</td>
                            <td align="right" style="color: #e53e3e;">-${formatCurrency(discountAmount)}</td>
                          </tr>
                          <tr>
                            <td style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 500;">${isJapanese ? '小計' : 'Subtotal'}</td>
                            <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 500;">${formatCurrency(subtotalAmount)}</td>
                          </tr>
                          ` : ''}
                          ${hasTax ? `
                          <tr>
                            <td style="color: #666;">${isJapanese ? `税金 (${quotation.tax_percentage}%)` : `Tax (${quotation.tax_percentage}%)`}</td>
                            <td align="right" style="color: #666;">+${formatCurrency(taxAmount)}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 700;">${isJapanese ? '合計金額' : 'Total Amount'}</td>
                            <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 700;">${formatCurrency(finalAmount)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- CTA SECTION -->
              <tr>
                <td style="padding:12px 24px 24px; text-align: center;">
                  <p style="margin:0 0 16px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align: left;">
                    ${emailTemplates[language].followup}
                  </p>
                  <a href="${appUrl}/quotations/${quotation.id}"
                     style="display:inline-block; padding:12px 24px; background:#E03E2D; color:#FFF;
                            text-decoration:none; border-radius:4px; font-family: Work Sans, sans-serif;
                            font-size:16px; font-weight:600; text-align: center;">
                    ${emailTemplates[language].callToAction}
                  </a>
                </td>
              </tr>
              
              <!-- ADDITIONAL INFO -->
              <tr>
                <td style="padding:0px 24px 24px;">
                  <p style="margin:20px 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${emailTemplates[language].additionalInfo}
                  </p>
                  <p style="margin:0 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${emailTemplates[language].closing}
                  </p>
                  <p style="margin:16px 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${emailTemplates[language].regards}<br>
                    ${emailTemplates[language].company}
                  </p>
                </td>
              </tr>
              
              <!-- FOOTER -->
              <tr>
                <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: Work Sans, sans-serif; font-size:12px; color:#8898AA;">
                  <p style="margin:0 0 4px;">${emailTemplates[language].company}</p>
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
  
  return emailHtml;
}

// Helper function to generate email Text content
function generateEmailText(language: string, customerName: string, formattedQuotationId: string, quotation: any, appUrl: string, isUpdated: boolean = false) {
  const isJapanese = language === 'ja';
  const serviceType = quotation.service_type || 'Transportation Service';
  const vehicleType = quotation.vehicle_type || 'Standard Vehicle';
  const hours = quotation.duration_hours || quotation.hours_per_day || 8;
  const serviceDays = quotation.service_days || quotation.number_of_days || quotation.duration_days || 1;
  const durationUnit = isJapanese ? '時間' : 'hours';
  
  const formatCurrency = (amount: number) => {
    const currency = quotation?.display_currency || quotation?.currency || 'JPY';
    if (!amount) return currency === 'JPY' ? `¥0` : `${currency} 0`;
    
    // Exchange rates (simplified for demo)
    const exchangeRates: Record<string, number> = {
      'JPY': 1,
      'USD': 0.0067,
      'EUR': 0.0062,
      'THB': 0.22,
      'CNY': 0.048,
      'SGD': 0.0091
    };

    // Convert amount from JPY to selected currency
    const originalCurrency = quotation?.currency || 'JPY';
    const convertedAmount = amount * (exchangeRates[currency] / exchangeRates[originalCurrency]);
    
    // Format based on currency
    if (currency === 'JPY' || currency === 'CNY') {
      return currency === 'JPY' 
        ? `¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (currency === 'THB') {
      return `฿${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(convertedAmount);
    }
  };

  // Recalculate final amount for text email
  let hourlyRate = quotation.price_per_day || quotation.hourly_rate || quotation.daily_rate || 0;
  let baseAmount = hourlyRate * serviceDays;
  if (quotation.total_amount && baseAmount === 0) {
      const totalAmt = parseFloat(String(quotation.total_amount));
      const discPerc = quotation.discount_percentage ? parseFloat(String(quotation.discount_percentage)) : 0;
      const taxPerc = quotation.tax_percentage ? parseFloat(String(quotation.tax_percentage)) : 0;
      let calcTotal = totalAmt;
      let subtotalPreTax = calcTotal;
      if (taxPerc > 0) subtotalPreTax = calcTotal / (1 + (taxPerc / 100));
      if (discPerc > 0) baseAmount = subtotalPreTax / (1 - (discPerc / 100));
      else baseAmount = subtotalPreTax;
  }
  const hasDiscount = quotation.discount_percentage && parseFloat(String(quotation.discount_percentage)) > 0;
  let subtotalAmount = baseAmount;
  if (hasDiscount) {
      const discountPercentage = parseFloat(String(quotation.discount_percentage));
      subtotalAmount = baseAmount - (baseAmount * discountPercentage / 100);
  }
  const hasTax = quotation.tax_percentage && parseFloat(String(quotation.tax_percentage)) > 0;
  let taxAmount = 0;
  if (hasTax) {
      const taxPercentage = parseFloat(String(quotation.tax_percentage));
      taxAmount = (subtotalAmount * taxPercentage) / 100;
  }
  const finalAmount = quotation.total_amount ? parseFloat(String(quotation.total_amount)) : (subtotalAmount + taxAmount);

  const greetingText = isUpdated
    ? (isJapanese ? '見積書が更新されました。' : 'Your quotation has been updated.')
    : (isJapanese ? 'お見積りありがとうございます。' : 'Thank you for your quotation request.');
    
  const textContent = `
${emailTemplates[language].subject} - #${formattedQuotationId}

${emailTemplates[language].greeting} ${customerName},

${greetingText} ${emailTemplates[language].intro}

${isJapanese ? 'サービス概要' : 'SERVICE SUMMARY'}:
- ${isJapanese ? 'サービスタイプ' : 'SERVICE TYPE'}: ${serviceType}
- ${isJapanese ? '車両' : 'VEHICLE'}: ${vehicleType}
- ${isJapanese ? '時間' : 'HOURS'}: ${hours} ${durationUnit}
${serviceDays > 1 ? `- ${isJapanese ? '日数' : 'NUMBER OF DAYS'}: ${serviceDays}` : ''}

${isJapanese ? '価格詳細' : 'PRICE DETAILS'}:
- ${isJapanese ? '合計金額' : 'TOTAL AMOUNT'}: ${formatCurrency(finalAmount)}

${emailTemplates[language].followup}

${emailTemplates[language].callToAction}: ${appUrl}/quotations/${quotation.id}

${emailTemplates[language].additionalInfo}
${emailTemplates[language].closing}

${emailTemplates[language].regards}
${emailTemplates[language].company}
  `;
  return textContent;
} 