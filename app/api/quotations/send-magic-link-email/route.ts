import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-client';
import { Resend } from 'resend';

console.log('✅ [SEND-MAGIC-LINK-EMAIL API] Module loaded, imports successful.');

// Email templates for different languages
const emailTemplates: Record<'en' | 'ja', {
  subject: string;
  greeting: string;
  intro: string;
  followup: string;
  closing: string;
  regards: string;
  company: string;
}> = {
  en: {
    subject: 'New Magic Link for Your Quotation',
    greeting: 'Hello',
    intro: 'A new magic link has been generated for your quotation. You can use this link to access your quotation securely.',
    followup: 'If you have any questions or need assistance, please contact us.',
    closing: 'We look forward to working with you.',
    regards: 'Best regards,',
    company: 'Driver (Thailand) Company Limited'
  },
  ja: {
    subject: '見積書の新しいマジックリンク',
    greeting: 'こんにちは',
    intro: '見積書の新しいマジックリンクが生成されました。このリンクを使用して、見積書に安全にアクセスできます。',
    followup: 'ご質問やサポートが必要な場合は、お気軽にお問い合わせください。',
    closing: 'よろしくお願いいたします。',
    regards: '敬具',
    company: 'Driver (Thailand) Company Limited'
  }
};

export async function POST(request: NextRequest) {
  console.log('🔄 [SEND-MAGIC-LINK-EMAIL API] Received POST request.');
  
  try {
    const { quotation_id, customer_email, language = 'en' } = await request.json();
    
    if (!quotation_id || !customer_email) {
      console.error('❌ [SEND-MAGIC-LINK-EMAIL API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing quotation_id or customer_email' },
        { status: 400 }
      );
    }

    // Validate language
    const validLanguage = (['en', 'ja'].includes(language) ? language : 'en') as 'en' | 'ja';
    
    // Initialize Supabase client
    const supabase = createServiceClient();
    
    // Get quotation details
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotation_id)
      .single();

    if (quotationError || !quotation) {
      console.error('❌ [SEND-MAGIC-LINK-EMAIL API] Error fetching quotation:', quotationError);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailDomain = (process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com').replace(/%$/, '');
    
    if (!resendApiKey) {
      console.error('❌ [SEND-MAGIC-LINK-EMAIL API] Resend API key not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

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

    // Generate magic link for secure quote access
    let magicLink = null;
    try {
      const magicLinkResponse = await fetch(`${appUrl}/api/quotations/create-magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotation_id: quotation_id,
          customer_email: customer_email,
        }),
      });

      if (magicLinkResponse.ok) {
        const magicLinkData = await magicLinkResponse.json();
        magicLink = magicLinkData.magic_link;
        console.log('✅ [SEND-MAGIC-LINK-EMAIL API] Magic link generated successfully');
      } else {
        console.warn('⚠️ [SEND-MAGIC-LINK-EMAIL API] Failed to generate magic link, continuing without it');
      }
    } catch (error) {
      console.warn('⚠️ [SEND-MAGIC-LINK-EMAIL API] Error generating magic link:', error);
    }

    // Format quotation ID
    const formattedQuotationId = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
    
    // Format the customer name nicely
    const customerName = quotation.customer_name || customer_email.split('@')[0];
    
    // Create email content
    const emailHtml = generateEmailHtml(validLanguage, customerName, formattedQuotationId, quotation, appUrl, magicLink);
    const textContent = generateEmailText(validLanguage, customerName, formattedQuotationId, quotation, appUrl, magicLink);

    console.log('🔄 [SEND-MAGIC-LINK-EMAIL API] Sending email with magic link');

    try {
      // Send email
      const { data: emailData, error: resendError } = await resend.emails.send({
        from: `Driver Japan <booking@${emailDomain}>`,
        to: [customer_email],
        subject: `${emailTemplates[validLanguage].subject} - ${formattedQuotationId}`,
        text: textContent,
        html: emailHtml,
      });

      if (resendError) {
        console.error('❌ [SEND-MAGIC-LINK-EMAIL API] Error reported by Resend:', JSON.stringify(resendError, null, 2));
        throw new Error(`Resend API Error: ${resendError.message || 'Unknown error'}`);
      }

      console.log('✅ [SEND-MAGIC-LINK-EMAIL API] Email sent successfully! ID:', emailData?.id);

      // Update quotation to mark magic link as generated
      await supabase
        .from('quotations')
        .update({ 
          magic_link_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', quotation_id);

      return NextResponse.json({
        success: true,
        message: 'Magic link email sent successfully',
        email_id: emailData?.id
      });

    } catch (error) {
      console.error('❌ [SEND-MAGIC-LINK-EMAIL API] Error sending email:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ [SEND-MAGIC-LINK-EMAIL API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate HTML email content - EXACT same template as send-email route
function generateEmailHtml(
  language: string, 
  customerName: string, 
  formattedQuotationId: string, 
  quotation: any, 
  appUrl: string,
  magicLink: string | null
): string {
  const template = emailTemplates[language as keyof typeof emailTemplates];
  const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
  const isJapanese = language === 'ja';
  
  // Email HTML template - EXACT same as send-email route
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
                          ${isJapanese ? '新しいマジックリンク' : 'New Magic Link for Your Quotation'}
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
                    ${template.intro}
                  </p>
                </td>
              </tr>
              
              <!-- QUOTATION DETAILS BLOCK -->
              <tr>
                <td style="padding:12px 24px 12px;">
                  <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif; color:#32325D; text-transform: uppercase;">
                    ${isJapanese ? '見積書詳細' : 'QUOTATION DETAILS'}
                  </h3>
                  <div style="background:#F8FAFC; border-radius:8px; padding:12px; font-family: Work Sans, sans-serif; line-height: 1.6;">
                    <p style="margin: 8px 0; font-size: 14px; color: #32325D;">• <strong>Quotation ID:</strong> ${formattedQuotationId}</p>
                    <p style="margin: 8px 0; font-size: 14px; color: #32325D;">• <strong>Service:</strong> ${quotation.title || 'Transportation Service'}</p>
                    <p style="margin: 8px 0; font-size: 14px; color: #32325D;">• <strong>Amount:</strong> ¥${quotation.amount?.toLocaleString() || 'N/A'}</p>
                  </div>
                </td>
              </tr>
              
              <!-- MAGIC LINK SECTION -->
              <tr>
                <td style="padding:12px 24px 24px; text-align: center;">
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
                  ` : `
                    <p style="margin: 0 0 16px; font-size: 14px; color: #E53E3E; font-family: Work Sans, sans-serif; line-height: 1.6; text-align: center;">
                      <em>Note: Magic link generation failed. Please contact support for assistance.</em>
                    </p>
                  `}
                </td>
              </tr>
              
              <!-- CLOSING -->
              <tr>
                <td style="padding:0px 24px 24px;">
                  <p style="margin:20px 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${template.followup}
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

// Generate plain text email content
function generateEmailText(
  language: string, 
  customerName: string, 
  formattedQuotationId: string, 
  quotation: any, 
  appUrl: string,
  magicLink: string | null
): string {
  const template = emailTemplates[language as keyof typeof emailTemplates];
  
  let text = `${template.greeting} ${customerName},\n\n`;
  text += `${template.intro}\n\n`;
  text += `Quotation Details:\n`;
  text += `- Quotation ID: ${formattedQuotationId}\n`;
  text += `- Service: ${quotation.title || 'Transportation Service'}\n`;
  text += `- Amount: ¥${quotation.amount?.toLocaleString() || 'N/A'}\n\n`;
  
  if (magicLink) {
    text += `View your quotation: ${magicLink}\n\n`;
    text += `Important: This magic link will expire in 7 days for security reasons.\n\n`;
  } else {
    text += `Note: Magic link generation failed. Please contact support for assistance.\n\n`;
  }
  
  text += `${template.followup}\n\n`;
  text += `${template.closing}\n\n`;
  text += `${template.regards}\n`;
  text += `${template.company}\n\n`;
  text += `This email was sent to ${quotation.customer_email}\n`;
  text += `If you have any questions, please contact our support team.`;
  
  return text;
}
