import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/main'
import { Resend } from 'resend'
// Remove jsPDF dependency - we're using Puppeteer now
// Import our new HTML PDF generator
import { generatePdfFromHtml, generateQuotationHtml } from '@/lib/html-pdf-generator'
// Import the new PDF helper utilities
import { embedWorkSansFont, createQuotationHeader } from '@/lib/pdf-helpers'
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

// Function to generate custom PDF using HTML-to-PDF approach
async function generateQuotationPDF(
  quotation: any, 
  language: string,
  selectedPackage: PricingPackage | null,
  selectedPromotion: PricingPromotion | null
): Promise<Buffer | null> {
  console.log(`🔄 [SEND-EMAIL API] Entering generateQuotationPDF for quote: ${quotation?.id}, lang: ${language}`);
  
  try {
    console.log('🔄 [SEND-EMAIL API] Starting PDF generation with HTML-to-PDF');
    
    // Generate the HTML for the quotation, passing all required data
    const htmlContent = generateQuotationHtml(quotation, language as 'en' | 'ja', selectedPackage, selectedPromotion);
    
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
    const contentType = request.headers.get('content-type') || ''
    const formData = contentType.includes('multipart/form-data') ? await request.formData() : null;
    
    const email = formData ? (formData.get('email') as string) : (await request.json()).email;
    const quotationId = formData ? (formData.get('quotation_id') as string) : (await request.json()).quotation_id;
    const languageParam = formData ? ((formData.get('language') as string) || 'en') : ((await request.json()).language || 'en');
    const language = (['en', 'ja'].includes(languageParam) ? languageParam : 'en') as 'en' | 'ja';
    
    console.log('🔄 [SEND-EMAIL API] Received request for quotation:', quotationId);
    
    if (!email || !quotationId) {
      console.error('❌ [SEND-EMAIL API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Authorization (works in both local and production)
    // Accept either NextAuth session (preferred) or Supabase auth cookie
    const session = await getServerSession(authOptions)
    const supabase = await getSupabaseServerClient()
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    const isDev = process.env.NODE_ENV !== 'production'

    if (!isDev) {
      const hasNextAuth = Boolean(session?.user)
      const hasSupabaseAuth = Boolean(supabaseUser)
      if (!hasNextAuth && !hasSupabaseAuth) {
        console.error('❌ [SEND-EMAIL API] Unauthorized: no session present (NextAuth or Supabase)')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // Optional: restrict to company domain when using NextAuth
      if (hasNextAuth) {
        const email = session!.user!.email || ''
        if (!email.endsWith('@japandriver.com')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
    }
    console.log('✅ [SEND-EMAIL API] Authorization passed')
    
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
    
    // Format quotation ID to use JPDR prefix
    const formattedQuotationId = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
    
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
    const emailHtml = generateEmailHtml(language, customerName, formattedQuotationId, quotation, appUrl, isUpdated, selectedPackage, selectedPromotion);
    const textContent = generateEmailText(language, customerName, formattedQuotationId, quotation, appUrl, isUpdated, selectedPackage, selectedPromotion);
    
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
          user_id: (session?.user as any)?.id || supabaseUser?.id || null,
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
function generateEmailHtml(
  language: 'en' | 'ja', 
  customerName: string, 
  formattedQuotationId: string, 
  quotation: any, 
  appUrl: string, 
  isUpdated: boolean = false,
  selectedPackage: PricingPackage | null,
  selectedPromotion: PricingPromotion | null
) {
  const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
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
                            `Your Quotation ${isUpdated ? 'Updated' : ''} from Driver`}
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
                          ${
                            // Check if we have multiple service items
                            quotation.quotation_items && Array.isArray(quotation.quotation_items) && quotation.quotation_items.length > 0 ?
                              // If we have items, display each one
                              quotation.quotation_items.map((item: QuotationItem, index: number) => {
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
                              `}).join('')
                              :
                              // Fallback to the original display if no items
                              `<tr>
                                <td style="padding-top: 15px;">${vehicleType}</td>
                                <td align="right" style="padding-top: 15px;"></td>
                              </tr>
                              <tr>
                                <td>${isJapanese ? `時間料金 (${hours} 時間 / 日)` : `Hourly Rate (${hours} hours / day)`}</td>
                                <td align="right">${formatCurrency(totals.serviceBaseTotal / serviceDays)}</td>
                              </tr>
                              ${serviceDays > 1 ? `
                              <tr>
                                <td style="color: #666;">${isJapanese ? '日数' : 'Number of Days'}</td>
                                <td align="right">× ${serviceDays}</td>
                              </tr>
                              ` : ''}`
                          }
                          <tr>
                            <td style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 500;">${isJapanese ? 'サービス小計' : 'Services Subtotal'}</td>
                            <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 500;">${formatCurrency(totals.serviceTotal)}</td>
                          </tr>
                          ${selectedPackage ? `
                          <tr>
                            <td style="padding-top: 10px; padding-bottom: 5px;">
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
                            <td align="right" style="padding-top: 10px; padding-bottom: 5px; vertical-align: top; color: #8b5cf6; font-weight: 500;">
                              ${formatCurrency(selectedPackage.base_price)}
                            </td>
                          </tr>
                          ` : ''}
                          ${(() => {
                            // Package discount
                            if (quotation.selected_package_id && quotation.package_discount) {
                              return `
                              <tr>
                                <td style="color: #3b82f6;">
                                  ${isJapanese ? 'パッケージ割引' : 'Package Discount'}
                                </td>
                                <td align="right" style="color: #3b82f6;">
                                  -${formatCurrency(quotation.package_discount)}
                                </td>
                              </tr>`;
                            }
                            return '';
                          })()}
                          ${totals.promotionDiscount > 0 ? `
                          <tr>
                            <td style="color: #10b981;">
                              ${isJapanese ? 'プロモーション' : 'Promotion'}: ${selectedPromotion?.name || quotation.selected_promotion_name || 'Discount'}
                            </td>
                            <td align="right" style="color: #10b981;">
                              -${formatCurrency(totals.promotionDiscount)}
                            </td>
                          </tr>` : totals.regularDiscount > 0 ? `
                          <tr>
                            <td style="color: #e53e3e;">${isJapanese ? `割引 (${quotation.discount_percentage}%)` : `Discount (${quotation.discount_percentage}%)`}</td>
                            <td align="right" style="color: #e53e3e;">-${formatCurrency(totals.regularDiscount)}</td>
                          </tr>
                          <tr>
                            <td style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 500;">${isJapanese ? '小計' : 'Subtotal'}</td>
                            <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 500;">${formatCurrency(totals.subtotal)}</td>
                          </tr>
                          ` : ''}
                          ${totals.taxAmount > 0 ? `
                          <tr>
                            <td style="color: #666;">${isJapanese ? `税金 (${quotation.tax_percentage}%)` : `Tax (${quotation.tax_percentage}%)`}</td>
                            <td align="right" style="color: #666;">+${formatCurrency(totals.taxAmount)}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 700;">${isJapanese ? '合計金額' : 'Total Amount'}</td>
                            <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 700;">${formatCurrency(totals.finalTotal)}</td>
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
                  <a href="${appUrl}/quotations/${quotation.id}"
                     style="display:inline-block; padding:12px 24px; background:#E03E2D; color:#FFF;
                            text-decoration:none; border-radius:4px; font-family: Work Sans, sans-serif;
                            font-size:16px; font-weight:600; text-align: center;">
                    ${template.callToAction}
                  </a>
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
  selectedPromotion: PricingPromotion | null
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

${template.callToAction}: ${appUrl}/quotations/${quotation.id}

${template.additionalInfo}
${template.closing}

${template.regards}
${template.company}
  `;
  return textContent;
} 