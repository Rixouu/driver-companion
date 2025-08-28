import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
// Remove jsPDF dependency - we're using Puppeteer now
// Import our new HTML PDF generator
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator'
import { Quotation, PricingPackage, PricingPromotion } from '@/types/quotations'

// Email templates for different languages
const reminderTemplates = {
  en: {
    subject: 'Reminder: Your Quotation',
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
    subject: 'リマインダー: あなたの見積書',
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

// Function to generate optimized PDF using the new generator
async function generateQuotationPDF(
  quotation: any, 
  language: string,
  selectedPackage: PricingPackage | null,
  selectedPromotion: PricingPromotion | null
): Promise<Buffer | null> {
  try {
    console.log('🔄 [SEND-REMINDER API] Starting optimized PDF generation');
    
    // Use the optimized PDF generator
    const pdfBuffer = await generateOptimizedQuotationPDF(
      quotation, 
      language as 'en' | 'ja', 
      selectedPackage, 
      selectedPromotion
    );
    
    console.log('✅ [SEND-REMINDER API] Optimized PDF generation successful!');
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ [SEND-REMINDER API] Error during PDF generation:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('==================== SEND-REMINDER ROUTE START ====================');
  
  // Set up timeout for the entire request (45 seconds)
  const timeoutId = setTimeout(() => {
    console.error('❌ [SEND-REMINDER API] Request timeout after 45 seconds');
  }, 45000);
  
  try {
    // Parse JSON request body
    const { id, language = 'en', includeQuotation = true } = await request.json();
    
    console.log(`[SEND-REMINDER API] Request data: id=${id}, language=${language}, includeQuotation=${includeQuotation}`);
    
    if (!id) {
      console.log('[SEND-REMINDER API] Missing quotation ID');
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }
    
    // Get template based on language
    const lang = language === 'ja' ? 'ja' : 'en';
    const template = reminderTemplates[lang];
    
    // Create server client (relies on cookies for auth)
    console.log('[SEND-REMINDER API] Creating Supabase server client');
    let supabase;
    try {
      supabase = await getSupabaseServerClient();
      console.log('[SEND-REMINDER API] Supabase server client created successfully');
    } catch (serverClientError) {
      console.error('[SEND-REMINDER API] Error creating server client:', serverClientError);
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: 'Error connecting to database' },
        { status: 500 }
      );
    }

    // Authenticate user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      console.error('[SEND-REMINDER API] Authentication error', authError);
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[SEND-REMINDER API] User authenticated:', authUser.id);
    
    // Fetch quotation data
    console.log(`[SEND-REMINDER API] Fetching quotation with ID: ${id}`);
    const { data: quotationData, error } = await supabase
      .from('quotations')
      .select('*, quotation_items (*)')
      .eq('id', id)
      .single();
    
    if (error || !quotationData) {
      console.error('[SEND-REMINDER API] Error fetching quotation data:', error);
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    console.log(`[SEND-REMINDER API] Quotation fetched successfully. ID: ${quotationData.id}, Status: ${quotationData.status}`);
    
    const quotation = quotationData as Quotation;
    
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

    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[SEND-REMINDER API] RESEND_API_KEY environment variable is not configured');
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }
    
    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log('[SEND-REMINDER API] Resend client initialized');
    
    // Get email domain from env or fallback
    const emailDomain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com';
    
    // Get the public URL for the Driver logo
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
    // Use japandriver.com for logo to match email sender domain and avoid image blocking
    const logoUrl = 'https://japandriver.com/img/driver-invoice-logo.png';
    
    // Format quotation ID to use JPDR prefix
    const formattedQuotationId = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
    
    // Get customer email
    const customerEmail = (quotation as any).customer_email || (quotation as any).email;
    if (!customerEmail) {
      console.error('[SEND-REMINDER API] No customer email found in quotation');
      return NextResponse.json(
        { error: 'No customer email found in quotation' },
        { status: 400 }
      );
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
          quotation_id: id,
          customer_email: customerEmail,
        }),
      });
      
      if (magicLinkResponse.ok) {
        const magicLinkData = await magicLinkResponse.json();
        magicLink = magicLinkData.magic_link;
        console.log('✅ [SEND-REMINDER API] Magic link generated successfully');
      } else {
        console.warn('⚠️ [SEND-REMINDER API] Failed to generate magic link, continuing without it');
      }
    } catch (error) {
      console.warn('⚠️ [SEND-REMINDER API] Error generating magic link:', error);
    }
    
    // Use magic link if available, otherwise fallback to regular URL
    const quotationUrl = magicLink || `${appUrl}/quotations/${id}`;
    
    console.log(`[SEND-REMINDER API] Sending reminder to: ${customerEmail} for quotation: ${formattedQuotationId}`);
    
    // Customer name with fallback
    const customerName = quotation.customer_name || 
                        (customerEmail.split('@')[0]) || 
                        (lang === 'ja' ? 'お客様' : 'Customer');
    
    // Email subject
    const emailSubject = `${template.subject} - ${formattedQuotationId}`;
    
    // Generate PDF if requested
    let pdfBuffer: Buffer | null = null;
    if (includeQuotation) {
      console.log('[SEND-REMINDER API] Generating PDF for attachment');
      pdfBuffer = await generateQuotationPDF(quotation, language, selectedPackage, selectedPromotion);
      
      if (!pdfBuffer) {
        console.error('[SEND-REMINDER API] Failed to generate PDF');
        return NextResponse.json(
          { error: 'Failed to generate PDF attachment' },
          { status: 500 }
        );
      }
      console.log('[SEND-REMINDER API] PDF generated successfully');
    }
    
    // Prepare email content
    const emailContent = generateReminderEmail(template, customerName, formattedQuotationId, quotationUrl, appUrl, logoUrl);
    const plainTextContent = generateReminderPlainText(template, customerName, formattedQuotationId, quotationUrl);
    
    // Prepare email with or without attachment
    const emailOptions: any = {
      from: `Driver Japan <booking@${emailDomain}>`,
      to: [customerEmail],
      bcc: ['booking@japandriver.com'],
      subject: emailSubject,
      text: plainTextContent,
      html: emailContent
    };
    
    // Add attachment if PDF was generated
    if (pdfBuffer) {
      emailOptions.attachments = [{
        filename: `${formattedQuotationId}-quotation.pdf`,
        content: pdfBuffer.toString('base64')
      }];
    }
    
    console.log('[SEND-REMINDER API] Sending email...');
    
    try {
      const { data: emailData, error: resendError } = await resend.emails.send(emailOptions);
      
      if (resendError) {
        console.error('[SEND-REMINDER API] Error reported by Resend:', JSON.stringify(resendError, null, 2));
        throw new Error(`Resend API Error: ${resendError.message || 'Unknown error'}`);
      }
      
      console.log('[SEND-REMINDER API] Email sent successfully! ID:', emailData?.id);
      
      // Update quotation with reminder sent timestamp
      const now = new Date().toISOString();
      await supabase
        .from('quotations')
        .update({ 
          reminder_sent_at: now,
          updated_at: now
        } as any)
        .eq('id', id);
      
      // Log activity
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: id,
          user_id: authUser.id,
          action: 'reminder_sent',
          details: { 
            email: customerEmail,
            sent_at: now
          }
        });
      
      console.log('==================== SEND-REMINDER ROUTE END ====================');
      
      clearTimeout(timeoutId);
      return NextResponse.json({ 
        success: true,
        message: 'Reminder email sent successfully',
        emailId: emailData?.id 
      });
      
    } catch (err) {
      console.error(`[SEND-REMINDER API] Error during email sending process: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`);
      if (err instanceof Error && err.stack) {
        console.error('[SEND-REMINDER API] Stack trace:', err.stack);
      }
      
      console.log('==================== SEND-REMINDER ROUTE END WITH ERROR ====================');
      
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Failed to send reminder email' },
        { status: 500 }
      );
    }
    
  } catch (err) {
    console.error('[SEND-REMINDER API] Unhandled error in POST handler:', err);
    if (err instanceof Error && err.stack) {
      console.error('[SEND-REMINDER API] POST Handler Stack Trace:', err.stack);
    }
    
    console.log('==================== SEND-REMINDER ROUTE END WITH ERROR ====================');
    
    clearTimeout(timeoutId);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred in POST handler' },
      { status: 500 }
    );
  }
}

// Helper function to generate HTML email content
function generateReminderEmail(template: any, customerName: string, quotationId: string, quotationUrl: string, appUrl: string, logoUrl: string): string {
  // Determine if Japanese language is being used
  const isJapanese = template === reminderTemplates.ja;
  
  return `
    <!DOCTYPE html>
    <html lang="${isJapanese ? 'ja' : 'en'}">
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
                          ${isJapanese ? 'リマインダー: ドライバーからの見積書' : 'Reminder: Your Quotation from Driver'}
                        </h1>
                        <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                          ${isJapanese ? '見積書番号' : 'Quotation'} #${quotationId}
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
              
              <!-- REMINDER INFO -->
              <tr>
                <td style="padding:0 24px 24px;">
                  <p style="margin:0 0 16px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6;">
                    ${template.followup}
                  </p>
                </td>
              </tr>
              
              <!-- CTA SECTION -->
              <tr>
                <td style="padding:12px 24px 24px; text-align: center;">
                  ${quotationUrl.includes('/quote-access/') ? `
                    <div style="padding: 16px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
                      <p style="margin: 0 0 12px; font-size: 14px; color: #64748B; font-family: Work Sans, sans-serif; line-height: 1.6; text-align: center;">
                        ${isJapanese ? '以下のセキュアリンクから見積書を確認してください:' : 'Please view your quotation using this secure link:'}
                      </p>
                      <a href="${quotationUrl}"
                         style="display: inline-block; padding: 12px 24px; background: #E03E2D; color: #FFF;
                                text-decoration: none; border-radius: 4px; font-family: Work Sans, sans-serif;
                                font-size: 16px; font-weight: 600; text-align: center; word-break: break-all;">
                        ${template.callToAction}
                      </a>
                      <p style="margin: 8px 0 0; font-size: 12px; color: #94A3B8; font-family: Work Sans, sans-serif; line-height: 1.4; text-align: center;">
                        ${isJapanese ? 'このリンクは7日間有効です' : 'This link is valid for 7 days'}
                      </p>
                    </div>
                  ` : `
                    <a href="${quotationUrl}"
                       style="display:inline-block; padding:12px 24px; background:#E03E2D; color:#FFF;
                              text-decoration:none; border-radius:4px; font-family: Work Sans, sans-serif;
                              font-size:16px; font-weight:600; text-align: center;">
                      ${template.callToAction}
                    </a>
                  `}
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
    </html>
  `;
}

// Helper function for plain text email content
function generateReminderPlainText(template: any, customerName: string, quotationId: string, quotationUrl: string): string {
  return `
${template.greeting} ${customerName},

${template.intro}

${template.followup}

${template.additionalInfo}

${template.callToAction}: ${quotationUrl}

${template.closing}

${template.regards},
${template.company}

© ${new Date().getFullYear()} Driver (Thailand) Company Limited. All rights reserved.
  `.trim();
} 