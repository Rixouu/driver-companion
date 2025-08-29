import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
// Import optimized PDF generator
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator'
import { QuotationItem, PricingPackage, PricingPromotion } from '@/types/quotations'

console.log('✅ [SEND-EMAIL API] Module loaded, imports successful.'); // Log after imports

// Email templates for different languages with proper typing
const emailTemplates: Record<'en' | 'ja', {
  subject: string;
  greeting: string;
  intro: string;
  followup: string;
  additionalInfo: string;
  callToAction: string;
  closing: string;
  regards: string;
  company: string;
  serviceDetails: string;
  pricingDetails: string;
}> = {
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

// Optimized PDF generation with caching and timeout handling
async function generateQuotationPDF(
  quotation: any, 
  language: string,
  selectedPackage: PricingPackage | null,
  selectedPromotion: PricingPromotion | null
): Promise<Buffer | null> {
  console.log(`🔄 [SEND-EMAIL API] Starting optimized PDF generation for quote: ${quotation?.id}, lang: ${language}`);
  
  try {
    // Use optimized PDF generator with caching
    const pdfBuffer = await generateOptimizedQuotationPDF(
      quotation, 
      language, 
      selectedPackage, 
      selectedPromotion
    );
    
    console.log('✅ [SEND-EMAIL API] Optimized PDF generation successful!');
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ [SEND-EMAIL API] Error during PDF generation:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 [SEND-EMAIL API] Received POST request.');
  
  // Set up timeout for the entire request (45 seconds)
  const timeoutId = setTimeout(() => {
    console.error('❌ [SEND-EMAIL API] Request timeout after 45 seconds');
  }, 45000);
  
  try {
    // Use formData to handle the multipart/form-data request
    const contentType = request.headers.get('content-type') || ''
    const formData = contentType.includes('multipart/form-data') ? await request.formData() : null;
    
    const email = formData ? (formData.get('email') as string) : (await request.json()).email;
    const quotationId = formData ? (formData.get('quotation_id') as string) : (await request.json()).quotation_id;
    const languageParam = formData ? ((formData.get('language') as string) || 'en') : ((await request.json()).language || 'en');
    const language = (['en', 'ja'].includes(languageParam) ? languageParam : 'en') as 'en' | 'ja';
    const bccEmails = formData ? (formData.get('bcc_emails') as string) : (await request.json()).bcc_emails || 'booking@japandriver.com';
    
    console.log('🔄 [SEND-EMAIL API] Received request for quotation:', quotationId);
    
    if (!email || !quotationId) {
      console.error('❌ [SEND-EMAIL API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create server client (relies on cookies for auth)
    console.log('🔄 [SEND-EMAIL API] Creating Supabase server client');
    let supabase;
    try {
      supabase = await getSupabaseServerClient();
      console.log('✅ [SEND-EMAIL API] Supabase server client created successfully');
    } catch (serverClientError) {
      console.error('❌ [SEND-EMAIL API] Error creating server client:', serverClientError);
      return NextResponse.json(
        { error: 'Error connecting to database' },
        { status: 500 }
      );
    }

    // Authenticate user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      console.error('❌ [SEND-EMAIL API] Authentication error', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ [SEND-EMAIL API] User authenticated:', authUser.id);
    
    // Fetch quotation data
    console.log('🔄 [SEND-EMAIL API] Fetching latest quotation data');
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*, customers (*), quotation_items (*)') // Include quotation_items
      .eq('id', quotationId)
      .single();
    
    if (error || !quotation) {
      console.error('❌ [SEND-EMAIL API] Error fetching quotation data:', error);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Fetch associated package and promotion
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

    console.log('✅ [SEND-EMAIL API] Found quotation:', { id: quotation.id, email: quotation.customer_email });
    
    // Generate a fresh PDF from the latest data using the new function
    console.log(`🔄 [SEND-EMAIL API] Calling generateQuotationPDF for quote: ${quotation.id}, lang: ${language}`); // Log before calling
    
    // Call the integrated PDF generation function, passing package and promotion
    const pdfBuffer = await generateQuotationPDF(quotation, language, selectedPackage, selectedPromotion);
    
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
    
    // Format quotation ID to use JPDR prefix
    const formattedQuotationId = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
    
    // Determine if this is an updated quotation
    // Check if it was previously sent OR if it's being sent after an update
    const isUpdated = (quotation.status === 'sent' && (quotation as any).last_sent_at) || 
                     (quotation.updated_at && quotation.created_at && 
                      new Date(quotation.updated_at).getTime() > new Date(quotation.created_at).getTime() + 60000); // 1 minute buffer
    
          // Generate magic link for secure quote access
      let magicLink = null;
      try {
        const magicLinkResponse = await fetch(`${appUrl}/api/quotations/create-magic-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quotation_id: quotationId,
            customer_email: email,
          }),
        });
        
        if (magicLinkResponse.ok) {
          const magicLinkData = await magicLinkResponse.json();
          magicLink = magicLinkData.magic_link;
          console.log('✅ [SEND-EMAIL API] Magic link generated successfully');
        } else {
          console.warn('⚠️ [SEND-EMAIL API] Failed to generate magic link, continuing without it');
        }
      } catch (error) {
        console.warn('⚠️ [SEND-EMAIL API] Error generating magic link:', error);
      }
      
      // Create email content with appropriate subject line
      const subjectPrefix = isUpdated ? 
        (language === 'ja' ? '更新した見積書' : 'Your Updated Quotation') : 
        (language === 'ja' ? 'ドライバーからの見積書' : 'Your Quotation');
      
      const emailSubject = `${subjectPrefix} - ${formattedQuotationId}`;
      
      // Format the customer name nicely
      const customerName = quotation.customer_name || email.split('@')[0];
      
      // Create the email content using existing helper functions
      const emailHtml = generateEmailHtml(language, customerName, formattedQuotationId, quotation, appUrl, isUpdated, selectedPackage, selectedPromotion, magicLink);
      const textContent = generateEmailText(language, customerName, formattedQuotationId, quotation, appUrl, isUpdated, selectedPackage, selectedPromotion, magicLink);
    
    console.log('🔄 [SEND-EMAIL API] Sending email with PDF attachment');
    
    try {
      // Parse BCC emails
      const bccEmailList = bccEmails.split(',').map((email: string) => email.trim()).filter((email: string) => email);
      
      // Send email with timeout
      console.log('🔄 [SEND-EMAIL API] Sending email via Resend...');
      const emailSendPromise = resend.emails.send({
        from: `Driver Japan <booking@${emailDomain}>`,
        to: [email],
        bcc: bccEmailList,
        subject: emailSubject,
        text: textContent,
        html: emailHtml,
        attachments: [{
          filename: `quotation-${formattedQuotationId}.pdf`,
          content: pdfBuffer.toString('base64')
        }]
      });

      // Add timeout for email sending (30 seconds)
      
      const { data: emailData, error: resendError } = await Promise.race([
        emailSendPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000)
        )
      ]);
    
      if (resendError) {
        console.error('❌ [SEND-EMAIL API] Error reported by Resend:', JSON.stringify(resendError, null, 2));
        throw new Error(`Resend API Error: ${resendError.message || 'Unknown error'}`); 
      }
      
      console.log('✅ [SEND-EMAIL API] Email sent successfully! ID:', emailData?.id);
      
      // Update quotation status to 'sent' and last_sent details
      // Expiry date should be 2 days from creation date, not from sending
      const createdDate = new Date(quotation.created_at);
      const expiryDate = new Date(createdDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      
      await supabase
        .from('quotations')
        .update({ 
          status: 'sent',
          last_sent_at: new Date().toISOString(),
          last_sent_to: email,
          // Expiry date: 2 days from creation (not from sending)
          expiry_date: expiryDate.toISOString()
        })
        .eq('id', quotationId);
    
      // Log activity
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: quotationId,
          user_id: authUser.id,
          action: 'email_sent',
          details: { 
            email: email,
            sent_at: new Date().toISOString(),
            sent_by: 'system'
          }
        });
      
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        success: true,
        message: 'Email sent successfully',
        emailId: emailData?.id 
      });
      
    } catch (err) {
      console.error(`❌ [SEND-EMAIL API] Error during email sending process: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`);
      if (err instanceof Error && err.stack) {
          console.error('Stack trace:', err.stack);
      }
      
      // Return standardized JSON error response
      clearTimeout(timeoutId);
      return NextResponse.json(
        { 
          error: err instanceof Error ? err.message : 'Failed to send email',
          code: 'EMAIL_SEND_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    
  } catch (err) {
    console.error('❌ [SEND-EMAIL API] Unhandled error in POST handler:', err);
    if (err instanceof Error && err.stack) {
        console.error('[SEND-EMAIL API] POST Handler Stack Trace:', err.stack);
    }
    
    // Return standardized JSON error response
    clearTimeout(timeoutId);
    return NextResponse.json(
      { 
        error: err instanceof Error ? err.message : 'An unexpected error occurred in POST handler',
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to generate email HTML content
function generateEmailHtml(
  language: 'en' | 'ja', 
  customerName: string, 
  formattedQuotationId: string, 
  quotation: any, 
  appUrl: string, 
  isUpdated: boolean = false,
  selectedPackage: PricingPackage | null,
  selectedPromotion: PricingPromotion | null,
  magicLink: string | null = null
) {
  // Use japandriver.com for logo to match email sender domain and avoid image blocking
  const logoUrl = 'https://japandriver.com/img/driver-invoice-logo.png';
  const isJapanese = language === 'ja';
  const template = emailTemplates[language];
    
  // Format quotation details for display
  const serviceType = quotation.service_type || 'Transportation Service';
  const vehicleType = quotation.vehicle_type || 'Standard Vehicle';
  const hours = quotation.duration_hours || quotation.hours_per_day || 8;
  const serviceDays = quotation.service_days || quotation.number_of_days || quotation.duration_days || 1;
  const durationUnit = isJapanese ? '時間' : 'hours';
  
  // Format pricing information
  const formatCurrency = (amount: number) => {
    const currency = quotation?.display_currency || quotation?.currency || 'JPY';
    if (!amount) return currency === 'JPY' ? `\u00A50` : `${currency} 0`;
    
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
        ? `\u00A5${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN\u00A5${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (currency === 'THB') {
      return `\u0E3F${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(convertedAmount);
    }
  };
  
  // Recalculate totals using the same logic as the PDF generator
  const calculateTotals = () => {
    let serviceBaseTotal = 0;
    let serviceTimeAdjustment = 0;
    
    if (quotation.quotation_items && quotation.quotation_items.length > 0) {
      quotation.quotation_items.forEach((item: QuotationItem) => {
        const itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
        serviceBaseTotal += itemBasePrice;
        
        if ((item as any).time_based_adjustment) {
          const timeAdjustment = itemBasePrice * ((item as any).time_based_adjustment / 100);
          serviceTimeAdjustment += timeAdjustment;
        }
      });
    } else {
      serviceBaseTotal = quotation.amount || 0;
    }
    
    const serviceTotal = serviceBaseTotal + serviceTimeAdjustment;
    const packageTotal = selectedPackage ? selectedPackage.base_price : 0;
    const baseTotal = serviceTotal + packageTotal;
    
    const discountPercentage = quotation.discount_percentage || 0;
    const taxPercentage = quotation.tax_percentage || 0;
    
    const promotionDiscount = selectedPromotion ? 
      (selectedPromotion.discount_type === 'percentage' ? 
        baseTotal * (selectedPromotion.discount_value / 100) : 
        selectedPromotion.discount_value) : 0;
    
    const regularDiscount = baseTotal * (discountPercentage / 100);
    const totalDiscount = promotionDiscount + regularDiscount;
    
    const subtotal = Math.max(0, baseTotal - totalDiscount);
    const taxAmount = subtotal * (taxPercentage / 100);
    const finalTotal = subtotal + taxAmount;
    
    return {
      serviceBaseTotal,
      serviceTimeAdjustment,
      serviceTotal,
      baseTotal,
      totalDiscount,
      promotionDiscount,
      regularDiscount,
      subtotal,
      taxAmount,
      finalTotal
    };
  };

  const totals = calculateTotals();
    
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
      <title>${template.subject}</title>
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
                          ${isJapanese ? 
                            `見積書${isUpdated ? '更新' : ''}` : 
                            `${isUpdated ? 'Your Updated Quotation' : 'Your Quotation'} from Driver`}
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
                    ${template.greeting} ${customerName},<br><br>
                    ${greetingText}
                  </p>
                </td>
              </tr>
              
              <!-- SERVICE SUMMARY BLOCK - Simplified -->
              <tr>
                <td style="padding:12px 24px 12px;">
                  <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif; color:#32325D; text-transform: uppercase;">
                    ${isJapanese ? 'サービス概要' : 'SERVICE SUMMARY'}
                  </h3>
                  <div style="background:#F8FAFC; border-radius:8px; padding:12px; font-family: Work Sans, sans-serif; line-height: 1.6;">
                    ${
                      // Check if we have multiple service items
                      quotation.quotation_items && Array.isArray(quotation.quotation_items) && quotation.quotation_items.length > 0 ?
                        // If we have items, display each one simply
                        quotation.quotation_items.map((item: QuotationItem) => 
                          `<p style="margin: 8px 0; font-size: 14px; color: #32325D;">• ${item.description || `${item.service_type_name || 'Service'} - ${item.vehicle_type || 'Standard Vehicle'}`}</p>`
                        ).join('')
                        :
                        // Fallback to the original display if no items
                        `<p style="margin: 8px 0; font-size: 14px; color: #32325D;">• ${serviceType}</p>
                         <p style="margin: 8px 0; font-size: 14px; color: #32325D;">• ${vehicleType}</p>
                         <p style="margin: 8px 0; font-size: 14px; color: #32325D;">• ${hours} ${durationUnit}${serviceDays > 1 ? ` × ${serviceDays} ${isJapanese ? '日' : 'days'}` : ''}</p>`
                    }
                  </div>
                </td>
              </tr>
              
              <!-- PRICE DETAILS BLOCK (EXACT same styling as payment link email) -->
              <tr>
                <td style="padding:0 24px 24px;">
                  <h3 style="margin:0 0 12px; font-size:16px; color:#32325D; text-transform: uppercase;">
                    ${isJapanese ? '価格詳細' : 'PRICE DETAILS'}
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="price-table"
                        style="background:#F8FAFC; border-radius:8px;">
                    <tr>
                      <td style="padding:12px;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <th align="left" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; font-size: 14px; color: #8898AA; text-transform: uppercase;">
                              ${isJapanese ? '内容' : 'DESCRIPTION'}
                            </th>
                            <th align="right" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; font-size: 14px; color: #8898AA; text-transform: uppercase;">
                              ${isJapanese ? '価格' : 'PRICE'}
                            </th>
                          </tr>
                          ${
                            // Check if we have detailed quotation data and totals
                            quotation.quotation_items && Array.isArray(quotation.quotation_items) && quotation.quotation_items.length > 0 ? (() => {
                              // Check if we have multiple service items
                              if (quotation.quotation_items && Array.isArray(quotation.quotation_items) && quotation.quotation_items.length > 0) {
                                // If we have items, display each one
                                return quotation.quotation_items.map((item: QuotationItem, index: number) => {
                                  const isPackage = item.service_type_name?.toLowerCase().includes('package');
                                  return `
                                  <tr>
                                    <td style="padding-top: ${index === 0 ? '15px' : '10px'}; padding-bottom: 5px; ${index < quotation.quotation_items.length - 1 ? 'border-bottom: 1px solid #f0f0f0;' : ''}">
                                      <div style="font-weight: ${index === 0 ? 'medium' : 'normal'}; font-size: 14px;">
                                        ${item.description || `${item.service_type_name || 'Service'} - ${item.vehicle_type || 'Standard Vehicle'}`}
                                      </div>
                                      ${!isPackage && item.service_type_name?.toLowerCase().includes('charter') ?
                                        `<div style="font-size: 13px; color: #666;">${item.service_days || 1} ${isJapanese ? '日' : 'days'}, ${item.hours_per_day || 8} ${isJapanese ? '時間/日' : 'hours/day'}</div>` : ''}
                                      ${selectedPackage && isPackage ? `
                                        <div style="font-size: 12px; color: #666; margin-top: 5px; padding-left: 10px;">
                                          <strong>${isJapanese ? 'サービス内容:' : 'Services Included:'}</strong><br>
                                          ${selectedPackage.items && selectedPackage.items.length > 0 ? 
                                            selectedPackage.items.map(pkgItem => `<span style="color: #8b5cf6; font-weight: 500;">• ${pkgItem.name}${pkgItem.vehicle_type ? ` <span style="color: #666;">(${pkgItem.vehicle_type})</span>` : ''}</span>`).join('<br>') :
                                            '<span style="color: #8b5cf6; font-weight: 500;">• All package services included</span>'
                                          }
                                        </div>
                                      ` : ''}
                                    </td>
                                    <td align="right" style="padding-top: ${index === 0 ? '15px' : '10px'}; padding-bottom: 5px; ${index < quotation.quotation_items.length - 1 ? 'border-bottom: 1px solid #f0f0f0;' : ''}; vertical-align: top;">
                                      ${formatCurrency(item.total_price || (item.unit_price * (item.quantity || 1)))}
                                    </td>
                                  </tr>
                                `}).join('');
                              } else {
                                // Fallback to simple service display
                                return `
                                <tr>
                                  <td style="padding-top: 15px;">${vehicleType}</td>
                                  <td align="right" style="padding-top: 15px;">${formatCurrency(totals.serviceTotal)}</td>
                                </tr>`;
                              }
                            })() : `
                            <tr>
                              <td style="padding-top: 15px;">${vehicleType}</td>
                              <td align="right" style="padding-top: 15px;">${formatCurrency(totals.serviceTotal)}</td>
                            </tr>`
                          }
                          ${totals ? `
                          <tr>
                            <td style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-weight: 500;">${isJapanese ? 'サービス小計' : 'Services Subtotal'}</td>
                            <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-weight: 500;">${formatCurrency(totals.serviceTotal)}</td>
                          </tr>
                          ${selectedPackage ? `
                          <tr>
                            <td style="padding-top: 8px; padding-bottom: 5px;">
                              <div style="font-weight: medium; font-size: 14px; color: #8b5cf6;">
                                ${isJapanese ? 'パッケージ' : 'Package'}: ${selectedPackage.name}
                              </div>
                              ${selectedPackage ? `
                                <div style="font-size: 12px; color: #666; margin-top: 5px; padding-left: 10px;">
                                  <strong>${isJapanese ? 'サービス内容:' : 'Services Included:'}</strong><br>
                                  ${selectedPackage.items && selectedPackage.items.length > 0 ? 
                                    selectedPackage.items.map(pkgItem => `<span style="color: #8b5cf6; font-weight: 500;">• ${pkgItem.name}${pkgItem.vehicle_type ? ` <span style="color: #666;">(${pkgItem.vehicle_type})</span>` : ''}</span>`).join('<br>') :
                                    '<span style="color: #8b5cf6; font-weight: 500;">• All package services included</span>'
                                  }
                                </div>
                              ` : ''}
                            </td>
                            <td align="right" style="padding-top: 8px; padding-bottom: 5px; vertical-align: top; color: #8b5cf6; font-weight: 500;">
                              ${formatCurrency(selectedPackage.base_price)}
                            </td>
                          </tr>
                          ` : ''}
                          ${(() => {
                            // Package discount
                            if (quotation.selected_package_id && quotation.package_discount) {
                              return `
                                                        <tr>
                            <td style="color: #3b82f6; padding-top: 5px;">
                              ${isJapanese ? 'パッケージ割引' : 'Package Discount'}
                            </td>
                            <td align="right" style="color: #3b82f6; padding-top: 5px;">
                              -${formatCurrency(quotation.package_discount)}
                            </td>
                          </tr>`;
                            }
                            return '';
                          })()}
                          ${totals.promotionDiscount > 0 ? `
                          <tr>
                            <td style="color: #10b981; padding-top: 5px;">
                              ${isJapanese ? 'プロモーション' : 'Promotion'}: ${selectedPromotion?.name || quotation.selected_promotion_name || 'Discount'}
                            </td>
                            <td align="right" style="color: #10b981; padding-top: 5px;">
                              -${formatCurrency(totals.promotionDiscount)}
                            </td>
                          </tr>` : totals.regularDiscount > 0 ? `
                          <tr>
                            <td style="color: #e53e3e; padding-top: 5px;">${isJapanese ? `割引 (${quotation.discount_percentage}%)` : `Discount (${quotation.discount_percentage}%)`}</td>
                            <td align="right" style="color: #e53e3e; padding-top: 5px;">-${formatCurrency(totals.regularDiscount)}</td>
                          </tr>
                          <tr>
                            <td style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-weight: 500;">${isJapanese ? '小計' : 'Subtotal'}</td>
                            <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-weight: 500;">${formatCurrency(totals.subtotal)}</td>
                          </tr>
                          ` : ''}
                          ${totals.taxAmount > 0 ? `
                          <tr>
                            <td style="color: #666; padding-top: 5px;">${isJapanese ? `税金 (${quotation.tax_percentage}%)` : `Tax (${quotation.tax_percentage}%)`}</td>
                            <td align="right" style="color: #666; padding-top: 5px;">+${formatCurrency(totals.taxAmount)}</td>
                          </tr>
                          ` : ''}` : ''}
                          <tr>
                            <td style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-weight: 700;">${isJapanese ? '合計金額' : 'Total Amount Due'}</td>
                            <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-weight: 700;">${formatCurrency(totals?.finalTotal)}</td>
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
                    ${template.followup}
                  </p>
                  
                  ${magicLink ? `
                    <div style="padding: 16px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
                      <p style="margin: 0 0 12px; font-size: 14px; color: #64748B; font-family: Work Sans, sans-serif; line-height: 1.6; text-align: center;">
                        ${isJapanese ? '以下のセキュアリンクから見積書を確認してください:' : 'Please view your quotation using this secure link:'}
                      </p>
                      <a href="${magicLink}"
                         style="display: inline-block; padding: 12px 24px; background: #E03E2D; color: #FFF;
                                text-decoration: none; border-radius: 4px; font-family: Work Sans, sans-serif;
                                font-size: 16px; font-weight: 600; text-align: center; word-break: break-all;">
                        ${isJapanese ? 'セキュアリンクで見積書を表示' : 'View Quote via Secure Link'}
                      </a>
                      <p style="margin: 8px 0 0; font-size: 12px; color: #94A3B8; font-family: Work Sans, sans-serif; line-height: 1.4; text-align: center;">
                        ${isJapanese ? 'このリンクは7日間有効です' : 'This link is valid for 7 days'}
                      </p>
                    </div>
                  ` : ''}
                </td>
              </tr>
              
              <!-- ADDITIONAL INFO -->
              <tr>
                <td style="padding:0px 24px 24px;">
                  <p style="margin:20px 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${template.additionalInfo}
                  </p>
                  <p style="margin:0 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${template.closing}
                  </p>
                  <p style="margin:16px 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${template.regards}<br>
                    ${template.company}
                  </p>
                </td>
              </tr>
              
              <!-- FOOTER -->
              <tr>
                <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: Work Sans, sans-serif; font-size:12px; color:#8898AA;">
                  <p style="margin:0 0 4px;">${template.company}</p>
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
function generateEmailText(
  language: 'en' | 'ja', 
  customerName: string, 
  formattedQuotationId: string, 
  quotation: any, 
  appUrl: string, 
  isUpdated: boolean = false,
  selectedPackage: PricingPackage | null,
  selectedPromotion: PricingPromotion | null,
  magicLink: string | null = null
) {
  const template = emailTemplates[language];
  const isJapanese = language === 'ja';
  const serviceType = quotation.service_type || 'Transportation Service';
  const vehicleType = quotation.vehicle_type || 'Standard Vehicle';
  const hours = quotation.duration_hours || quotation.hours_per_day || 8;
  const serviceDays = quotation.service_days || quotation.number_of_days || quotation.duration_days || 1;
  const durationUnit = isJapanese ? '時間' : 'hours';
  
  const formatCurrency = (amount: number) => {
    const currency = quotation?.display_currency || quotation?.currency || 'JPY';
    if (!amount) return currency === 'JPY' ? `\u00A50` : `${currency} 0`;
    
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
        ? `\u00A5${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN\u00A5${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (currency === 'THB') {
      return `\u0E3F${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(convertedAmount);
    }
  };

  // Recalculate final amount for text email including all adjustments
  const calculateTotals = () => {
    let serviceBaseTotal = 0;
    let serviceTimeAdjustment = 0;
    
    if (quotation.quotation_items && quotation.quotation_items.length > 0) {
      quotation.quotation_items.forEach((item: QuotationItem) => {
        const itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
        serviceBaseTotal += itemBasePrice;
        
        if ((item as any).time_based_adjustment) {
          const timeAdjustment = itemBasePrice * ((item as any).time_based_adjustment / 100);
          serviceTimeAdjustment += timeAdjustment;
        }
      });
    } else {
      serviceBaseTotal = quotation.amount || 0;
    }
    
    const serviceTotal = serviceBaseTotal + serviceTimeAdjustment;
    const packageTotal = selectedPackage ? selectedPackage.base_price : 0;
    const baseTotal = serviceTotal + packageTotal;
    
    const discountPercentage = quotation.discount_percentage || 0;
    const taxPercentage = quotation.tax_percentage || 0;
    
    const promotionDiscount = selectedPromotion ? 
      (selectedPromotion.discount_type === 'percentage' ? 
        baseTotal * (selectedPromotion.discount_value / 100) : 
        selectedPromotion.discount_value) : 0;
    
    const regularDiscount = baseTotal * (discountPercentage / 100);
    const totalDiscount = promotionDiscount + regularDiscount;
    
    const subtotal = Math.max(0, baseTotal - totalDiscount);
    const taxAmount = subtotal * (taxPercentage / 100);
    const finalTotal = subtotal + taxAmount;
    
    return { finalTotal };
  };

  const { finalTotal } = calculateTotals();

  const greetingText = isUpdated
    ? (isJapanese ? '見積書が更新されました。' : 'Your quotation has been updated.')
    : (isJapanese ? 'お見積りありがとうございます。' : 'Thank you for your quotation request.');
    
  const textContent = `
${template.subject} - #${formattedQuotationId}

${template.greeting} ${customerName},

${greetingText} ${template.intro}

${isJapanese ? 'サービス概要' : 'SERVICE SUMMARY'}:
${
  // Check if we have multiple service items
  quotation.quotation_items && Array.isArray(quotation.quotation_items) && quotation.quotation_items.length > 0 ?
    // If we have items, display each one
    quotation.quotation_items.map((item: QuotationItem) => 
      `- ${item.description || `${item.service_type_name || 'Service'} - ${item.vehicle_type || 'Standard Vehicle'}`} ${formatCurrency(item.total_price || (item.unit_price * (item.quantity || 1)))}
      ${item.service_type_name?.toLowerCase().includes('charter') ?
        `  ${item.service_days || 1} ${isJapanese ? '日' : 'days'}, ${item.hours_per_day || 8} ${isJapanese ? '時間/日' : 'hours/day'}` :
        item.pickup_date ?
        `  ${isJapanese ? '集合日' : 'Pickup'}: ${new Date(item.pickup_date).toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US')}${item.pickup_time ? `, ${item.pickup_time}` : ''}` :
        ''
      }`
    ).join('\n')
    :
    // Fallback to the original display if no items
    `- ${isJapanese ? 'サービスタイプ' : 'SERVICE TYPE'}: ${serviceType}
- ${isJapanese ? '車両' : 'VEHICLE'}: ${vehicleType}
- ${isJapanese ? '時間' : 'HOURS'}: ${hours} ${durationUnit}
${serviceDays > 1 ? `- ${isJapanese ? '日数' : 'NUMBER OF DAYS'}: ${serviceDays}` : ''}`
}

${isJapanese ? '価格詳細' : 'PRICE DETAILS'}:
- ${isJapanese ? '合計金額' : 'TOTAL AMOUNT'}: ${formatCurrency(finalTotal)}

${template.followup}

${magicLink ? `
${isJapanese ? '以下のセキュアリンクから見積書を確認してください:' : 'Please view your quotation using this secure link:'}
${magicLink}
${isJapanese ? 'このリンクは7日間有効です' : 'This link is valid for 7 days'}

` : ''}${template.additionalInfo}
${template.closing}

${template.regards}
${template.company}
  `;
  return textContent;
} 