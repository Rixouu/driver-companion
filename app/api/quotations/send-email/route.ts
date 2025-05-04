import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

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

export async function POST(request: NextRequest) {
  try {
    // Use formData to handle the multipart/form-data request with the PDF file
    const formData = await request.formData();
    
    const email = formData.get('email') as string;
    const quotationId = formData.get('quotation_id') as string;
    const includeDetails = formData.get('include_details') === 'true';
    const language = (formData.get('language') as string) || 'en';
    const quotationPdf = formData.get('quotation_pdf') as File;
    
    if (!email || !quotationId || !quotationPdf) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get template based on language
    const lang = language === 'ja' ? 'ja' : 'en';
    const template = emailTemplates[lang];
    
    // Fetch quotation data for email content
    const supabase = await createServerSupabaseClient();
    
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single();
    
    if (error || !quotation) {
      console.error('Error fetching quotation data:', error);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Read PDF file
    const pdfArrayBuffer = await quotationPdf.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);
    
    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Get email domain from env or fallback
    const emailDomain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com';
    
    // Get the public URL for the Driver logo
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
    const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
    
    // Create the quotation view URL
    const quotationUrl = `${appUrl}/quotations/${quotationId}`;
    
    // Format quotation ID to use JPDR prefix
    const formattedQuotationId = `JPDR-${quotationId.padStart(4, '0')}`;
    
    // Format currency with proper locale - use JPY as default
    const formatCurrency = (amount: number, currency: string = 'JPY') => {
      return new Intl.NumberFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    };
    
    // Service details - Format service type properly
    let serviceType = quotation.service_type || 'Transportation Service';
    
    // Get duration value - access as any to handle potentially missing property
    const durationValue = (quotation as any).duration?.toString() || '8';
    
    // Format service type for better display
    if (serviceType.toLowerCase().includes('charter')) {
      serviceType = `Charter Services (Hourly) - ${durationValue} hours`;
    }
    
    const vehicleType = quotation.vehicle_type || 'Standard Vehicle';
    const pickupDate = quotation.pickup_date || 'To be determined';
    const pickupTime = quotation.pickup_time || 'To be determined';
    
    // Price calculations
    const subtotal = typeof quotation.total_amount === 'string' ? 
      parseFloat(quotation.total_amount) : 
      (typeof quotation.total_amount === 'number' ? quotation.total_amount : 0);
      
    // Calculate discount if applicable
    const hasDiscount = quotation.discount_percentage && parseFloat(String(quotation.discount_percentage)) > 0;
    let discountAmount = 0;
    let totalAfterDiscount = subtotal;
    
    if (hasDiscount) {
      const discountPercentage = parseFloat(String(quotation.discount_percentage));
      discountAmount = (subtotal * discountPercentage) / 100;
      totalAfterDiscount = subtotal - discountAmount;
    }
    
    // Calculate tax if applicable
    const hasTax = quotation.tax_percentage && parseFloat(String(quotation.tax_percentage)) > 0;
    let taxAmount = 0;
    let finalTotal = totalAfterDiscount;
    
    if (hasTax) {
      const taxPercentage = parseFloat(String(quotation.tax_percentage));
      taxAmount = (totalAfterDiscount * taxPercentage) / 100;
      finalTotal = totalAfterDiscount + taxAmount;
    }
    
    const currency = 'JPY'; // Set currency to JPY
    const total = formatCurrency(finalTotal, currency);
    
    // Customer name with fallback
    const customerName = quotation.customer_name || 
                        (quotation.customer_email?.split('@')[0]) || 
                        (lang === 'ja' ? 'お客様' : 'Customer');
    
    // Check if we have items data
    const hasItems = formData.get('has_items') === 'true';
    const itemsDataStr = formData.get('items_data') as string;
    
    // Parse items data if available
    let items = [];
    if (hasItems && itemsDataStr) {
      try {
        items = JSON.parse(itemsDataStr);
      } catch (e) {
        console.error('Failed to parse items data:', e);
      }
    }
    
    // Build service details HTML (Block 1)
    let serviceDetailsHTML = `
    <tr>
      <td style="padding:16px 16px 8px 16px;">
        <span style="font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
          ${lang === 'ja' ? 'サービスタイプ' : 'SERVICE TYPE'}
        </span>
      </td>
      <td style="padding:16px 16px 8px 16px;">
        <span style="font-size:14px; color:#32325D; font-family: Work Sans, sans-serif;">
          ${serviceType}
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 16px 8px 16px;">
        <span style="font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
          ${lang === 'ja' ? '車両タイプ' : 'VEHICLE TYPE'}
        </span>
      </td>
      <td style="padding:16px 16px 8px 16px;">
        <span style="font-size:14px; color:#32325D; font-family: Work Sans, sans-serif;">
          ${vehicleType}
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 16px 8px 16px;">
        <span style="font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
          ${lang === 'ja' ? '所要時間' : 'DURATION'}
        </span>
      </td>
      <td style="padding:16px 16px 8px 16px;">
        <span style="font-size:14px; color:#32325D; font-family: Work Sans, sans-serif;">
          ${durationValue} ${lang === 'ja' ? '時間' : 'hours'}
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 16px 8px 16px;">
        <span style="font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
          ${lang === 'ja' ? '送迎日' : 'PICKUP DATE'}
        </span>
      </td>
      <td style="padding:16px 16px 8px 16px;">
        <span style="font-size:14px; color:#32325D; font-family: Work Sans, sans-serif;">
          ${pickupDate}
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 16px 8px 16px;">
        <span style="font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
          ${lang === 'ja' ? '送迎時間' : 'PICKUP TIME'}
        </span>
      </td>
      <td style="padding:16px 16px 8px 16px;">
        <span style="font-size:14px; color:#32325D; font-family: Work Sans, sans-serif;">
          ${pickupTime}
        </span>
      </td>
    </tr>`;
    
    // Build price breakdown HTML (Block 2)
    let priceDetailsHTML = `
    <tr>
      <td style="padding:16px 16px 8px 16px;">
        <span style="font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
          ${lang === 'ja' ? '小計' : 'SUBTOTAL'}
        </span>
      </td>
      <td style="padding:16px 16px 8px 16px; text-align:right;">
        <span style="font-size:14px; color:#32325D; font-family: Work Sans, sans-serif;">
          ${formatCurrency(subtotal, currency)}
        </span>
      </td>
    </tr>`;
    
    // Add discount if applicable
    if (hasDiscount) {
      const discountPercentage = parseFloat(String(quotation.discount_percentage));
      priceDetailsHTML += `
      <tr>
        <td style="padding:16px 16px 8px 16px;">
          <span style="font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
            ${lang === 'ja' ? '割引' : 'DISCOUNT'} (${discountPercentage}%)
          </span>
        </td>
        <td style="padding:16px 16px 8px 16px; text-align:right;">
          <span style="font-size:14px; color:#32325D; font-family: Work Sans, sans-serif;">
            -${formatCurrency(discountAmount, currency)}
          </span>
        </td>
      </tr>`;
    }
    
    // Add tax if applicable
    if (hasTax) {
      const taxPercentage = parseFloat(String(quotation.tax_percentage));
      priceDetailsHTML += `
      <tr>
        <td style="padding:16px 16px 8px 16px;">
          <span style="font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
            ${lang === 'ja' ? '税金' : 'TAX'} (${taxPercentage}%)
          </span>
        </td>
        <td style="padding:16px 16px 8px 16px; text-align:right;">
          <span style="font-size:14px; color:#32325D; font-family: Work Sans, sans-serif;">
            ${formatCurrency(taxAmount, currency)}
          </span>
        </td>
      </tr>`;
    }
    
    // Add total row
    priceDetailsHTML += `
    <tr>
      <td style="padding:16px 16px;">
        <span style="font-size:14px; color:#8898AA; text-transform:uppercase; font-weight:bold; font-family: Work Sans, sans-serif;">
          ${lang === 'ja' ? '合計' : 'TOTAL'}
        </span>
      </td>
      <td style="padding:16px 16px; text-align:right;">
        <span style="font-size:16px; color:#32325D; font-weight:bold; font-family: Work Sans, sans-serif;">
          ${total}
        </span>
      </td>
    </tr>`;
    
    // Send the email using Resend
    const { data, error: sendError } = await resend.emails.send({
      from: `Driver <quotations@${emailDomain}>`,
      to: [email],
      subject: template.subject,
      text: `${template.subject} - #${formattedQuotationId}
      
${template.greeting} ${customerName},

${template.intro}

${template.followup}

${template.callToAction}: ${quotationUrl}

${template.additionalInfo}
${template.closing}

${template.regards}
${template.company}
`,
      html: `<!DOCTYPE html>
<html lang="${lang}">
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
    }
    @media only screen and (max-width:600px) {
      .container { width:100%!important; }
      .stack { display:block!important; width:100%!important; text-align:center!important; }
      .timeline { padding-left:0!important; }
    }
  </style>
</head>
<body style="background:#F2F4F6; margin:0; padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:24px;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#FFFFFF; border-radius:8px; overflow:hidden;">
          
          <!-- HEADER with white-circle badge -->
          <tr>
            <td style="background:linear-gradient(135deg,#E03E2D 0%,#F45C4C 100%);">
              <table width="100%" role="presentation">
                <tr>
                  <td align="center" style="padding:24px;">
                    <!-- white circular badge -->
                    <table cellpadding="0" cellspacing="0" style="
                      background:#FFFFFF;
                      border-radius:50%;
                      width:64px;
                      height:64px;
                      margin:0 auto 12px;
                    ">
                      <tr>
                        <td align="center" valign="middle" style="text-align:center;">
                          <img src="${logoUrl}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin:0; font-size:24px; color:#FFF; font-weight:600;">${template.subject}</h1>
                    <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                      ${lang === 'ja' ? '見積書番号' : 'Quotation'} #${formattedQuotationId}
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
                ${template.intro}
              </p>
            </td>
          </tr>
          
          <!-- SERVICE DETAILS BLOCK -->
          <tr>
            <td style="padding:24px 24px 12px;">
              <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif; color:#32325D;">
                ${template.serviceDetails}
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                    style="background:#F8FAFC; border-radius:8px;">
                ${serviceDetailsHTML}
              </table>
            </td>
          </tr>
          
          <!-- PRICE DETAILS BLOCK -->
          <tr>
            <td style="padding:12px 24px 24px;">
              <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif; color:#32325D;">
                ${template.pricingDetails}
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                    style="background:#F8FAFC; border-radius:8px;">
                ${priceDetailsHTML}
              </table>
            </td>
          </tr>
          
          <!-- CTA SECTION -->
          <tr>
            <td style="padding:0px 24px 24px;">
              <p style="margin:0 0 16px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6;">
                ${template.followup}
              </p>
            </td>
          </tr>
          
          <!-- CTA BUTTON -->
          <tr>
            <td align="center" style="padding:0 24px 24px;">
              <a href="${quotationUrl}"
                 style="display:inline-block; padding:12px 24px; background:#E03E2D; color:#FFF;
                        text-decoration:none; border-radius:4px; font-family: Work Sans, sans-serif;
                        font-size:16px; font-weight:600;">
                ${template.callToAction}
              </a>
            </td>
          </tr>
          
          <!-- ADDITIONAL INFO BELOW BUTTON -->
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
</html>`,
      attachments: [
        {
          filename: `quotation-${formattedQuotationId}.pdf`,
          content: pdfBuffer
        }
      ]
    });
    
    if (sendError) {
      console.error('Error sending email with Resend:', sendError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
    
    // Update the quotation to record it was sent
    await supabase
      .from('quotations')
      .update({ 
        status: 'sent',
        last_sent_at: new Date().toISOString(),
        last_sent_to: email
      })
      .eq('id', quotationId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in quotation send-email route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 