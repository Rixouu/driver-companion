import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

// Email templates for different languages
const reminderTemplates = {
  en: {
    subject: 'Reminder: Your Quotation from Driver',
    greeting: 'Hello',
    intro: 'We wanted to remind you about the quotation we sent recently.',
    followup: 'Your quotation is still available for review. If you would like to proceed, please click the button below.',
    additionalInfo: 'From your online quote you can accept, decline, comment or print.',
    callToAction: 'View Your Quotation Online',
    closing: 'We look forward to hearing from you.',
    regards: 'Best regards,',
    company: 'Driver (Thailand) Company Limited'
  },
  ja: {
    subject: 'リマインダー: ドライバーからの見積書',
    greeting: 'こんにちは',
    intro: '先日お送りした見積書についてリマインドさせていただきます。',
    followup: 'お見積もりはまだご確認いただけます。ご検討いただける場合は、以下のボタンをクリックしてください。',
    additionalInfo: 'オンライン見積もりから、承諾、辞退、コメント、印刷ができます。',
    callToAction: 'オンラインで見積書を確認',
    closing: 'ご連絡をお待ちしております。',
    regards: '敬具',
    company: 'Driver (Thailand) Company Limited'
  }
};

// Check if the generateQuotationPDF exists at the correct path, if not, we'll create a placeholder function
let generateQuotationPDF;
try {
  ({ generateQuotationPDF } = require('@/lib/pdf/quotation'));
} catch (e) {
  generateQuotationPDF = async (quotation, lang) => {
    console.error('generateQuotationPDF function not found, cannot attach PDF');
    return null;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse JSON request body
    const { id, language = 'en', includeQuotation = true } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }
    
    // Get template based on language
    const lang = language === 'ja' ? 'ja' : 'en';
    const template = reminderTemplates[lang];
    
    // Fetch quotation data for email content
    const supabase = await createServerSupabaseClient();
    
    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: quotationData, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !quotationData) {
      console.error('Error fetching quotation data:', error);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Use type assertion to handle potentially missing properties
    const quotation = quotationData as any;
    
    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Get email domain from env or fallback
    const emailDomain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com';
    
    // Get the public URL for the Driver logo
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
    const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
    
    // Create the quotation view URL
    const quotationUrl = `${appUrl}/quotations/${id}`;
    
    // Format quotation ID to use JPDR prefix
    const formattedQuotationId = `JPDR-${quotation.quote_number || id}`;
    
    // Customer name with fallback
    const customerName = quotation.customer_name || 
                        (quotation.customer_email?.split('@')[0]) || 
                        (lang === 'ja' ? 'お客様' : 'Customer');
    
    // Format services - placeholder for now
    let serviceDetails = [{ name: quotation.title || 'Service', price: quotation.amount || 0 }];
    
    // Try to parse services if they exist
    try {
      if (quotation.services && typeof quotation.services === 'string') {
        const parsed = JSON.parse(quotation.services);
        if (Array.isArray(parsed) && parsed.length > 0) {
          serviceDetails = parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing services:', e);
    }

    // Format currency
    const formatCurrency = (amount) => {
      return `¥${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };
    
    // Generate quotation details HTML if includeQuotation is true
    const quotationDetailsHtml = includeQuotation ? `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="background:#F8FAFC; border-radius:8px;">
        <tr>
          <th style="text-align:left; padding:16px; border-bottom:1px solid #ddd; background-color:#f8f9fa; border-top-left-radius:8px; border-top-right-radius:8px;">
            <span style="font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
              ${lang === 'ja' ? 'サービス' : 'Service'}
            </span>
          </th>
          <th style="text-align:right; padding:16px; border-bottom:1px solid #ddd; background-color:#f8f9fa; border-top-right-radius:8px;">
            <span style="font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
              ${lang === 'ja' ? '金額' : 'Amount'}
            </span>
          </th>
        </tr>
        ${serviceDetails.map(service => `
        <tr>
          <td style="text-align:left; padding:16px; border-bottom:1px solid #eee;">
            <span style="font-size:14px; color:#32325D; font-family: Work Sans, sans-serif;">
              ${service.name}
            </span>
          </td>
          <td style="text-align:right; padding:16px; border-bottom:1px solid #eee;">
            <span style="font-size:14px; color:#32325D; font-family: Work Sans, sans-serif;">
              ${formatCurrency(service.price)}
            </span>
          </td>
        </tr>
        `).join('')}
        <tr>
          <td style="text-align:left; padding:16px;">
            <span style="font-size:14px; color:#8898AA; text-transform:uppercase; font-weight:bold; font-family: Work Sans, sans-serif;">
              ${lang === 'ja' ? '合計' : 'Total'}
            </span>
          </td>
          <td style="text-align:right; padding:16px;">
            <span style="font-size:16px; color:#32325D; font-weight:bold; font-family: Work Sans, sans-serif;">
              ${formatCurrency(quotation.amount || 0)}
            </span>
          </td>
        </tr>
      </table>
    ` : '';
    
    // Generate the plain text version of the email
    const textContent = `${template.subject} - #${formattedQuotationId}
      
${template.greeting} ${customerName},

${template.intro}

${template.followup}

${template.callToAction}: ${quotationUrl}

${template.additionalInfo}
${template.closing}

${template.regards}
${template.company}
`;
    
    // Email HTML template with improved styling to match quotation look and feel
    const emailHtml = `
    <!DOCTYPE html>
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
              
              <!-- QUOTATION DETAILS if includeQuotation is true -->
              ${includeQuotation ? `
              <tr>
                <td style="padding:12px 24px 24px;">
                  <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif; color:#32325D;">
                    ${lang === 'ja' ? 'サービス詳細' : 'SERVICE DETAILS'}
                  </h3>
                  ${quotationDetailsHtml}
                </td>
              </tr>
              ` : ''}
              
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
    </html>`;
    
    // Generate PDF for attachment
    let pdfBuffer = null;
    if (includeQuotation) {
      try {
        pdfBuffer = await generateQuotationPDF(quotation, language);
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        // Continue without PDF attachment if it fails
      }
    }
    
    // Send the email using the Resend API
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `Driver Japan <booking@${emailDomain}>`,
      to: [quotation.customer_email],
      subject: `${template.subject} - #${formattedQuotationId}`,
      text: textContent,
      html: emailHtml,
      attachments: pdfBuffer ? [
        {
          filename: `quotation-${formattedQuotationId}.pdf`,
          content: pdfBuffer
        }
      ] : []
    });
    
    if (emailError) {
      console.error('Resend API error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send reminder email' },
        { status: 500 }
      );
    }
    
    // Record the reminder activity
    await supabase
      .from('quotation_activities')
      .insert({
        quotation_id: id,
        user_id: session.user.id,
        action: 'reminder_sent',
        details: { 
          status: quotation.status,
          email: quotation.customer_email,
          language,
          includeQuotation
        }
      });
    
    return NextResponse.json({
      success: true,
      message: 'Reminder email sent successfully',
      id: emailData?.id
    });
  } catch (error) {
    console.error('Error processing reminder request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 