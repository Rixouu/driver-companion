import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator';
import { Quotation, PricingPackage, PricingPromotion } from '@/types/quotations';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

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

// Function to generate optimized PDF using the new generator
async function generateQuotationPDF(
  quotation: any, 
  language: string,
  selectedPackage: PricingPackage | null,
  selectedPromotion: PricingPromotion | null
): Promise<Buffer | null> {
  try {
    console.log('🔄 [ROBUST-SEND-REMINDER] Starting optimized PDF generation');
    
    // Use the optimized PDF generator
    const pdfBuffer = await generateOptimizedQuotationPDF(
      quotation, 
      language as 'en' | 'ja', 
      selectedPackage, 
      selectedPromotion
    );
    
    console.log('✅ [ROBUST-SEND-REMINDER] Optimized PDF generation successful!');
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ [ROBUST-SEND-REMINDER] Error during PDF generation:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 [ROBUST-SEND-REMINDER] Starting robust reminder processing...');
  
  try {
    const { id, language = 'en', includeQuotation = true } = await request.json();
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Quotation ID is required',
        code: 'MISSING_ID'
      }, { status: 400 });
    }

    // Step 1: Immediate response to client (202 Accepted)
    const response = NextResponse.json({ 
      message: 'Reminder processing started',
      quotationId: id,
      status: 'processing',
      estimatedTime: '10-15 seconds'
    }, { status: 202 });

    // Step 2: Process reminder in background (don't await)
    processReminderInBackground(id, language, includeQuotation);

    return response;

  } catch (error) {
    console.error('❌ [ROBUST-SEND-REMINDER] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to start reminder processing',
      code: 'PROCESSING_ERROR'
    }, { status: 500 });
  }
}

async function processReminderInBackground(
  id: string,
  language: string,
  includeQuotation: boolean
) {
  try {
    console.log(`🔄 [ROBUST-SEND-REMINDER] Background processing started for quotation: ${id}`);
    
    // Get template based on language
    const lang = language === 'ja' ? 'ja' : 'en';
    const template = reminderTemplates[lang];
    
    // Create server client (relies on cookies for auth)
    let supabase;
    try {
      supabase = await getSupabaseServerClient();
      console.log('✅ [ROBUST-SEND-REMINDER] Supabase server client created successfully');
    } catch (serverClientError) {
      console.error('❌ [ROBUST-SEND-REMINDER] Error creating server client:', serverClientError);
      return;
    }

    // Fetch the quotation
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select('*, quotation_items (*), customers (*)')
      .eq('id', id)
      .single();
    
    if (fetchError || !quotation) {
      console.error('❌ [ROBUST-SEND-REMINDER] Error fetching quotation:', fetchError);
      return;
    }
    
    // Ensure we have a valid email address
    const emailAddress = quotation.customer_email || 
                      (quotation.customers ? quotation.customers.email : null);
    
    if (!emailAddress) {
      console.log('❌ [ROBUST-SEND-REMINDER] No valid email address found for this quotation');
      return;
    }
    
    // Generate PDF if requested
    let pdfBuffer: Buffer | null = null;
    if (includeQuotation) {
      console.log('🔄 [ROBUST-SEND-REMINDER] Generating PDF...');
      
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
      
      try {
        pdfBuffer = await generateQuotationPDF(quotation, language, selectedPackage, selectedPromotion);
        console.log('✅ [ROBUST-SEND-REMINDER] PDF generated successfully');
      } catch (pdfError) {
        console.error('❌ [ROBUST-SEND-REMINDER] PDF generation error:', pdfError);
        // Continue without PDF
      }
    }
    
    // Send email notification
    try {
      console.log('🔄 [ROBUST-SEND-REMINDER] Sending reminder email...');
      
      // Initialize Resend with API key
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Get email domain from env or fallback
      const emailDomain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com';
      
      // Get the public URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
      
      // Format quotation ID
      const formattedQuotationId = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
      
      // Customer name with fallback
      const customerName = (quotation.customers ? quotation.customers.name : null) || 
                         quotation.customer_name || 
                         'Customer';
      
      // Generate email HTML
      const emailHtml = generateReminderEmailHtml(lang, customerName, formattedQuotationId, quotation, appUrl, template);
      
      const { data: emailData, error: resendError } = await resend.emails.send({
        from: `Driver Japan <booking@${emailDomain}>`,
        to: [emailAddress],
        subject: template.subject,
        html: emailHtml,
        attachments: pdfBuffer ? [
          {
            filename: `${formattedQuotationId}-quotation.pdf`,
            content: pdfBuffer.toString('base64')
          }
        ] : undefined
      });

      if (resendError) {
        throw new Error(`Resend API Error: ${resendError.message || 'Unknown error'}`);
      }
      
      console.log('✅ [ROBUST-SEND-REMINDER] Email sent successfully:', emailData?.id);
      
      // Update last_email_sent_at
      await supabase
        .from('quotations')
        .update({ 
          last_email_sent_at: new Date().toISOString() 
        } as any)
        .eq('id', id);

      console.log('✅ [ROBUST-SEND-REMINDER] Background processing completed successfully');

    } catch (emailError) {
      console.error('❌ [ROBUST-SEND-REMINDER] Email sending error:', emailError);
    }
  } catch (error) {
    console.error('❌ [ROBUST-SEND-REMINDER] Background processing failed:', error);
  }
}

// Helper function to generate reminder email HTML
function generateReminderEmailHtml(language: string, customerName: string, formattedQuotationId: string, quotation: any, appUrl: string, template: any) {
  const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
  
  return `
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
                          ${template.subject}
                        </h1>
                        <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                          ${formattedQuotationId}
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
                    ${template.intro}<br><br>
                    ${template.followup}
                  </p>
                </td>
              </tr>
              
              <!-- CTA SECTION -->
              <tr>
                <td style="padding:12px 24px 24px; text-align: center;">
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
}
