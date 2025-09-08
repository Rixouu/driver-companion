import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
// Import optimized PDF generator
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator'
import { QuotationItem, PricingPackage, PricingPromotion } from '@/types/quotations'
import { getTeamFooterHtml } from '@/lib/team-addresses'

console.log('✅ [SEND-EMAIL-OPTIMIZED API] Module loaded, imports successful.');

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
  console.log(`🔄 [SEND-EMAIL-OPTIMIZED API] Starting optimized PDF generation for quote: ${quotation?.id}, lang: ${language}`);
  
  try {
    // Use optimized PDF generator with caching
    const pdfBuffer = await generateOptimizedQuotationPDF(
      quotation, 
      language, 
      selectedPackage, 
      selectedPromotion
    );
    
    console.log('✅ [SEND-EMAIL-OPTIMIZED API] Optimized PDF generation successful!');
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ [SEND-EMAIL-OPTIMIZED API] Error during PDF generation:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('==================== SEND-EMAIL-OPTIMIZED ROUTE START ====================');
  
  // Set up timeout for the entire request (30 seconds - reduced from 45)
  const timeoutId = setTimeout(() => {
    console.error('❌ [SEND-EMAIL-OPTIMIZED API] Request timeout after 30 seconds');
  }, 30000);
  
  try {
    // Use formData to handle the multipart/form-data request
    const contentType = request.headers.get('content-type') || ''
    const formData = contentType.includes('multipart/form-data') ? await request.formData() : null;
    
    const email = formData ? (formData.get('email') as string) : (await request.json()).email;
    const quotationId = formData ? (formData.get('quotation_id') as string) : (await request.json()).quotation_id;
    const languageParam = formData ? ((formData.get('language') as string) || 'en') : ((await request.json()).language || 'en');
    const language = (['en', 'ja'].includes(languageParam) ? languageParam : 'en') as 'en' | 'ja';
    const bccEmails = formData ? (formData.get('bcc_emails') as string) : (await request.json()).bcc_emails || 'booking@japandriver.com';
    
    console.log('🔄 [SEND-EMAIL-OPTIMIZED API] Received request for quotation:', quotationId);
    
    if (!quotationId) {
      console.error('❌ [SEND-EMAIL-OPTIMIZED API] Missing quotation ID');
      return NextResponse.json(
        { error: 'Missing quotation ID' },
        { status: 400 }
      );
    }
    
    // OPTIMIZATION 1: Parallel initialization
    console.log('🔄 [SEND-EMAIL-OPTIMIZED API] Starting parallel initialization');
    const [supabase, resend] = await Promise.all([
      getSupabaseServerClient(),
      Promise.resolve(new Resend(process.env.RESEND_API_KEY))
    ]);
    console.log('✅ [SEND-EMAIL-OPTIMIZED API] Parallel initialization complete');

    // Authenticate user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      console.error('❌ [SEND-EMAIL-OPTIMIZED API] Authentication error', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ [SEND-EMAIL-OPTIMIZED API] User authenticated:', authUser.id);
    
    // OPTIMIZATION 2: Parallel data fetching
    console.log('🔄 [SEND-EMAIL-OPTIMIZED API] Starting parallel data fetching');
    const [
      quotationResult,
      packageResult,
      promotionResult
    ] = await Promise.allSettled([
      supabase
        .from('quotations')
        .select('*, customers (*), quotation_items (*)')
        .eq('id', quotationId)
        .single(),
      // Package fetch will be handled after quotation is fetched
      Promise.resolve(null),
      // Promotion fetch will be handled after quotation is fetched
      Promise.resolve(null)
    ]);
    
    // Handle quotation result
    if (quotationResult.status === 'rejected' || !quotationResult.value.data) {
      console.error('❌ [SEND-EMAIL-OPTIMIZED API] Error fetching quotation data:', quotationResult.status === 'rejected' ? quotationResult.reason : quotationResult.value.error);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    const quotation = quotationResult.value.data;
    
    // Ensure quotation has a customer email
    if (!quotation.customer_email) {
      console.error('❌ [SEND-EMAIL-OPTIMIZED API] Quotation has no customer email');
      return NextResponse.json(
        { error: 'Quotation has no customer email' },
        { status: 400 }
      );
    }
    
    // OPTIMIZATION 3: Fetch package and promotion in parallel after getting quotation
    console.log('🔄 [SEND-EMAIL-OPTIMIZED API] Fetching package and promotion data');
    const packageId = (quotation as any).selected_package_id || (quotation as any).package_id || (quotation as any).pricing_package_id;
    const promotionCode = (quotation as any).selected_promotion_code || (quotation as any).promotion_code;
    
    const [packageFetchResult, promotionFetchResult] = await Promise.allSettled([
      packageId ? supabase.from('pricing_packages').select('*, items:pricing_package_items(*)').eq('id', packageId).single() : Promise.resolve({ data: null }),
      promotionCode ? supabase.from('pricing_promotions').select('*').eq('code', promotionCode).single() : Promise.resolve({ data: null })
    ]);
    
    const selectedPackage = packageFetchResult.status === 'fulfilled' ? packageFetchResult.value.data as PricingPackage | null : null;
    const selectedPromotion = promotionFetchResult.status === 'fulfilled' ? promotionFetchResult.value.data as PricingPromotion | null : null;
    
    console.log('✅ [SEND-EMAIL-OPTIMIZED API] Parallel data fetching complete');
    
    // OPTIMIZATION 4: Parallel processing - PDF generation and email preparation
    console.log('🔄 [SEND-EMAIL-OPTIMIZED API] Starting parallel processing');
    const [
      pdfResult,
      magicLinkResult,
      emailPrepResult
    ] = await Promise.allSettled([
      generateQuotationPDF(quotation, language, selectedPackage, selectedPromotion),
      // Generate magic link
      (async () => {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
            (process.env.NODE_ENV === 'production' ? 'https://driver-companion.vercel.app' : 'http://localhost:3000');
          
          const magicLinkResponse = await fetch(`${appUrl}/api/quotations/create-magic-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quotation_id: quotationId,
              customer_email: email,
            }),
          });
          
          if (magicLinkResponse.ok) {
            const magicLinkData = await magicLinkResponse.json();
            return magicLinkData.magic_link;
          }
          return null;
        } catch (error) {
          console.warn('⚠️ [SEND-EMAIL-OPTIMIZED API] Error generating magic link:', error);
          return null;
        }
      })(),
      // Prepare email data
      (async () => {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
          (process.env.NODE_ENV === 'production' ? 'https://driver-companion.vercel.app' : 'http://localhost:3000');
        
        const formattedQuotationId = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
        const isUpdated = (quotation.status === 'sent' && (quotation as any).last_sent_at) || 
                         (quotation.updated_at && quotation.created_at && 
                          new Date(quotation.updated_at).getTime() > new Date(quotation.created_at).getTime() + 60000);
        
        const emailForName = quotation.customer_email || email || '';
        const customerName = quotation.customer_name || (emailForName ? emailForName.split('@')[0] : 'Customer');
        
        const subjectPrefix = isUpdated ? 
          (language === 'ja' ? '更新した見積書' : 'Your Updated Quotation') : 
          (language === 'ja' ? 'ドライバーからの見積書' : 'Your Quotation');
        
        const emailSubject = `${subjectPrefix} - ${formattedQuotationId}`;
        
        return {
          appUrl,
          formattedQuotationId,
          isUpdated,
          customerName,
          emailSubject
        };
      })()
    ]);
    
    // Handle results
    const pdfBuffer = pdfResult.status === 'fulfilled' ? pdfResult.value : null;
    const magicLink = magicLinkResult.status === 'fulfilled' ? magicLinkResult.value : null;
    const emailData = emailPrepResult.status === 'fulfilled' ? emailPrepResult.value : null;
    
    if (!pdfBuffer) {
      console.error('❌ [SEND-EMAIL-OPTIMIZED API] Failed to generate PDF');
      return NextResponse.json(
        { error: 'Failed to generate PDF attachment' },
        { status: 500 }
      );
    }
    
    if (!emailData) {
      console.error('❌ [SEND-EMAIL-OPTIMIZED API] Failed to prepare email data');
      return NextResponse.json(
        { error: 'Failed to prepare email data' },
        { status: 500 }
      );
    }
    
    console.log('✅ [SEND-EMAIL-OPTIMIZED API] Parallel processing complete');
    
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ [SEND-EMAIL-OPTIMIZED API] RESEND_API_KEY environment variable is not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }
    
    // Get email domain from env or fallback
    const emailDomain = (process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com').replace(/%$/, '');
    
    // Generate email content
    console.log('🔄 [SEND-EMAIL-OPTIMIZED API] Generating email content');
    let emailHtml, textContent;
    try {
      emailHtml = generateEmailHtml(language, emailData.customerName, emailData.formattedQuotationId, quotation, emailData.appUrl, emailData.isUpdated, selectedPackage, selectedPromotion, magicLink);
      textContent = generateEmailText(language, emailData.customerName, emailData.formattedQuotationId, quotation, emailData.appUrl, emailData.isUpdated, selectedPackage, selectedPromotion, magicLink);
      console.log('✅ [SEND-EMAIL-OPTIMIZED API] Email content generated successfully');
    } catch (error) {
      console.error('❌ [SEND-EMAIL-OPTIMIZED API] Error generating email content:', error);
      throw new Error(`Failed to generate email content: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // OPTIMIZATION 5: Send email with reduced timeout
    console.log('🔄 [SEND-EMAIL-OPTIMIZED API] Sending email with PDF attachment');
    try {
      // Parse BCC emails
      const safeBccEmails = bccEmails || 'booking@japandriver.com';
      const bccEmailList = safeBccEmails.split(',').map((email: string) => email.trim()).filter((email: string) => email);
      
      // Send email with timeout (reduced from 30 to 20 seconds)
      console.log('🔄 [SEND-EMAIL-OPTIMIZED API] Sending email via Resend...');
      const emailSendPromise = resend.emails.send({
        from: `Driver Japan <booking@${emailDomain}>`,
        to: [quotation.customer_email || email],
        bcc: bccEmailList,
        subject: emailData.emailSubject,
        text: textContent,
        html: emailHtml,
        attachments: [{
          filename: `quotation-${emailData.formattedQuotationId}.pdf`,
          content: pdfBuffer.toString('base64')
        }]
      });

      const { data: emailData_result, error: resendError } = await Promise.race([
        emailSendPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout after 20 seconds')), 20000)
        )
      ]);
    
      if (resendError) {
        console.error('❌ [SEND-EMAIL-OPTIMIZED API] Error reported by Resend:', JSON.stringify(resendError, null, 2));
        throw new Error(`Resend API Error: ${resendError.message || 'Unknown error'}`); 
      }
      
      console.log('✅ [SEND-EMAIL-OPTIMIZED API] Email sent successfully! ID:', emailData_result?.id);
      
      // OPTIMIZATION 6: Non-blocking database updates
      console.log('🔄 [SEND-EMAIL-OPTIMIZED API] Updating quotation status (non-blocking)');
      const updatePromises = [
        // Update quotation status
        supabase
          .from('quotations')
          .update({ 
            status: 'sent',
            last_sent_at: new Date().toISOString(),
            last_sent_to: quotation.customer_email || email,
            expiry_date: new Date(new Date(quotation.created_at).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', quotationId),
        // Log activity
        supabase
          .from('quotation_activities')
          .insert({
            quotation_id: quotationId,
            user_id: authUser.id,
            action: 'email_sent',
            details: { 
              email: quotation.customer_email || email,
              sent_at: new Date().toISOString(),
              sent_by: 'system'
            }
          })
      ];
      
      // Don't wait for these updates to complete
      Promise.allSettled(updatePromises).then((results) => {
        console.log('✅ [SEND-EMAIL-OPTIMIZED API] Database updates completed (non-blocking)');
      });
      
      clearTimeout(timeoutId);
      console.log('✅ [SEND-EMAIL-OPTIMIZED API] Request completed successfully');
      return NextResponse.json({ 
        success: true,
        message: 'Email sent successfully',
        emailId: emailData_result?.id 
      });
      
    } catch (err) {
      console.error(`❌ [SEND-EMAIL-OPTIMIZED API] Error during email sending process: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`);
      if (err instanceof Error && err.stack) {
          console.error('Stack trace:', err.stack);
      }
      
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
    console.error('❌ [SEND-EMAIL-OPTIMIZED API] Unhandled error in POST handler:', err);
    if (err instanceof Error && err.stack) {
        console.error('[SEND-EMAIL-OPTIMIZED API] POST Handler Stack Trace:', err.stack);
    }
    
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

// Helper function to generate email HTML content (same as original)
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
  
  // Email HTML template (same as original - truncated for brevity)
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
              
              <!-- SERVICE SUMMARY BLOCK -->
              <tr>
                <td style="padding:12px 24px 12px;">
                  <h3 style="margin:0 0 12px; font-size:16px; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; color:#32325D; text-transform: uppercase;">
                    ${isJapanese ? 'サービス概要' : 'SERVICE SUMMARY'}
                  </h3>
                  <div style="background:#F8FAFC; border-radius:8px; padding:12px; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; line-height: 1.6;">
                    ${
                      quotation.quotation_items && Array.isArray(quotation.quotation_items) && quotation.quotation_items.length > 0 ?
                        quotation.quotation_items.map((item: QuotationItem) => 
                          `<p style="margin: 8px 0; font-size: 14px; color: #32325D;">• ${item.description || `${item.service_type_name || 'Service'} - ${item.vehicle_type || 'Standard Vehicle'}`}</p>`
                        ).join('')
                        :
                        `<p style="margin: 8px 0; font-size: 14px; color: #32325D;">• ${serviceType}</p>
                         <p style="margin: 8px 0; font-size: 14px; color: #32325D;">• ${vehicleType}</p>
                         <p style="margin: 8px 0; font-size: 14px; color: #32325D;">• ${hours} ${durationUnit}${serviceDays > 1 ? ` × ${serviceDays} ${isJapanese ? '日' : 'days'}` : ''}</p>`
                    }
                  </div>
                </td>
              </tr>
              
              <!-- PRICE DETAILS BLOCK -->
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
                          <tr>
                            <td style="padding-top: 15px;">${vehicleType}</td>
                            <td align="right" style="padding-top: 15px;">${formatCurrency(totals.serviceTotal)}</td>
                          </tr>
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
                  <p style="margin:0 0 16px; font-size:14px; color:#32325D; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; line-height:1.6; text-align: left;">
                    ${template.followup}
                  </p>
                  
                  ${magicLink ? `
                    <div style="padding: 16px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
                      <p style="margin: 0 0 12px; font-size: 14px; color: #64748B; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; line-height: 1.6; text-align: center;">
                        ${isJapanese ? '以下のセキュアリンクから見積書を確認してください:' : 'Please view your quotation using this secure link:'}
                      </p>
                      <a href="${magicLink}"
                         style="display: inline-block; padding: 12px 24px; background: #E03E2D; color: #FFF;
                                text-decoration: none; border-radius: 4px; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif;
                                font-size: 16px; font-weight: 600; text-align: center; word-break: break-all;">
                        ${isJapanese ? 'セキュアリンクで見積書を表示' : 'View Quote via Secure Link'}
                      </a>
                      <p style="margin: 8px 0 0; font-size: 12px; color: #94A3B8; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; line-height: 1.4; text-align: center;">
                        ${isJapanese ? 'このリンクは7日間有効です' : 'This link is valid for 7 days'}
                      </p>
                    </div>
                  ` : ''}
                </td>
              </tr>
              
              <!-- ADDITIONAL INFO -->
              <tr>
                <td style="padding:0px 24px 24px;">
                  <p style="margin:20px 0 8px; font-size:14px; color:#32325D; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; line-height:1.6; text-align:center;">
                    ${template.additionalInfo}
                  </p>
                  <p style="margin:0 0 8px; font-size:14px; color:#32325D; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; line-height:1.6; text-align:center;">
                    ${template.closing}
                  </p>
                  <p style="margin:16px 0 8px; font-size:14px; color:#32325D; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; line-height:1.6; text-align:center;">
                    ${template.regards}<br>
                    ${template.company}
                  </p>
                </td>
              </tr>
              
              <!-- FOOTER -->
              <tr>
                <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; font-size:12px; color:#8898AA;">
                  ${getTeamFooterHtml(quotation.team_location || 'thailand', isJapanese)}
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

// Helper function to generate email Text content (same as original)
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
  quotation.quotation_items && Array.isArray(quotation.quotation_items) && quotation.quotation_items.length > 0 ?
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
