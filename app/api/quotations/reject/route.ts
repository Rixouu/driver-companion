import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator';
import { Quotation, PricingPackage, PricingPromotion } from '@/types/quotations';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

// Helper function to generate email HTML with styling exactly matching send-email
function generateEmailHtml(language: string, customerName: string, formattedQuotationId: string, quotation: any, appUrl: string, reason?: string) {
  const isJapanese = language === 'ja';
  const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
  
  const translations = {
    en: {
      subject: 'Quotation Rejected',
      greeting: 'Hello',
      rejected: 'Your quotation has been rejected.',
      viewDetails: 'View Quotation Details',
      contactUs: 'If you have any questions, please contact us.',
      regards: 'Best regards,',
      company: 'Driver (Thailand) Company Limited',
      reasonLabel: 'Reason:',
      additionalInfo: 'From your online quote you can view all details, print, or contact us with any questions.',
      closing: 'Thank you for your interest in our services.'
    },
    ja: {
      subject: '見積書が却下されました',
      greeting: 'こんにちは',
      rejected: 'お客様の見積書が却下されました。',
      viewDetails: '見積書の詳細を確認する',
      contactUs: 'ご質問がございましたら、お気軽にお問い合わせください。',
      regards: '敬具',
      company: 'Driver (Thailand) Company Limited',
      reasonLabel: '理由:',
      additionalInfo: 'オンライン見積もりから、詳細確認、印刷、お問い合わせができます。',
      closing: '弊社サービスへのご関心をいただき、ありがとうございます。'
    }
  };
  
  const t = translations[language as 'en' | 'ja'] || translations.en;
  
  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${t.subject}</title>
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
                          ${isJapanese ? '見積書が却下されました' : 'Quotation Rejected'}
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
                    ${t.greeting} ${customerName},<br><br>
                    ${t.rejected}
                  </p>
                </td>
              </tr>
              
              <!-- REASON SECTION -->
              ${reason ? `
              <tr>
                <td style="padding:12px 24px;">
                  <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif; color:#32325D;">
                    ${t.reasonLabel}
                  </h3>
                  <div style="background:#F8FAFC; border-radius:8px; padding:12px; font-family: Work Sans, sans-serif; line-height: 1.6;">
                    <p style="margin: 8px 0; font-size: 14px; color: #32325D;">${reason}</p>
                  </div>
                </td>
              </tr>
              ` : ''}
              
              <!-- CTA SECTION -->
              <tr>
                <td style="padding:12px 24px 24px; text-align: center;">
                  <p style="margin:0 0 16px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align: left;">
                    ${t.contactUs}
                  </p>
                  <a href="${appUrl}/quotations/${quotation.id}"
                     style="display:inline-block; padding:12px 24px; background:#E03E2D; color:#FFF;
                            text-decoration:none; border-radius:4px; font-family: Work Sans, sans-serif;
                            font-size:16px; font-weight:600; text-align: center;">
                    ${t.viewDetails}
                  </a>
                </td>
              </tr>
              
              <!-- ADDITIONAL INFO -->
              <tr>
                <td style="padding:0px 24px 24px;">
                  <p style="margin:20px 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${t.additionalInfo}
                  </p>
                  <p style="margin:0 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${t.closing}
                  </p>
                  <p style="margin:16px 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${t.regards}<br>
                    ${t.company}
                  </p>
                </td>
              </tr>
              
              <!-- FOOTER -->
              <tr>
                <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: Work Sans, sans-serif; font-size:12px; color:#8898AA;">
                  <p style="margin:0 0 4px;">${t.company}</p>
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

export async function POST(request: NextRequest) {
  console.log('🚀 [ROBUST-REJECT] Starting robust rejection processing...');
  
  try {
    const { id, reason, signature, customerId, skipStatusCheck = false, skipEmail = false } = await request.json();
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // Step 1: Immediate response to client (202 Accepted)
    const response = NextResponse.json({ 
      message: 'Rejection processing started',
      quotationId: id,
      status: 'processing',
      estimatedTime: '10-15 seconds'
    }, { status: 202 });

    // Step 2: Process rejection in background (don't await)
    processRejectionInBackground(id, reason, signature, customerId, skipStatusCheck, skipEmail);

    return response;

  } catch (error) {
    console.error('❌ [ROBUST-REJECT] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to start rejection processing',
      code: 'PROCESSING_ERROR'
    }, { status: 500 });
  }
}

async function processRejectionInBackground(
  id: string,
  reason: string,
  signature: string,
  customerId: string | null,
  skipStatusCheck: boolean,
  skipEmail: boolean
) {
  try {
    console.log(`🔄 [ROBUST-REJECT] Background processing started for quotation: ${id}`);
    
    // Get translations
    const { t } = await getDictionary();
    
    // Create server client (relies on cookies for auth)
    let supabase;
    try {
      supabase = await getSupabaseServerClient();
      console.log('✅ [ROBUST-REJECT] Supabase server client created successfully');
    } catch (serviceClientError) {
      console.error('❌ [ROBUST-REJECT] Error creating server client:', serviceClientError);
      return;
    }

    // Fetch the quotation
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select('*, quotation_items (*)')
      .eq('id', id)
      .single();
    
    if (fetchError || !quotation) {
      console.error('❌ [ROBUST-REJECT] Error fetching quotation:', fetchError);
      return;
    }
    
    // Only check status if skipStatusCheck is false
    if (!skipStatusCheck && quotation.status === 'rejected') {
      console.log(`❌ [ROBUST-REJECT] Cannot reject quotation with status: ${quotation.status}`);
      return;
    }

    // Only update status if needed
    if (!skipStatusCheck) {
      const { error: updateError } = await supabase
        .from('quotations')
        .update({ 
          status: 'rejected',
          rejected_reason: reason,
          rejected_at: new Date().toISOString(),
          rejected_by: 'system',
          rejection_signature: signature
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('❌ [ROBUST-REJECT] Error updating quotation:', updateError);
        return;
      }
      
      console.log('✅ [ROBUST-REJECT] Quotation status updated to rejected');
      
      // Log activity
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: id,
          user_id: 'system',
          action: 'rejected',
          details: {
            reason: reason || null,
            rejected_by_customer_id: customerId,
            rejected_by_staff_id: 'system'
          }
        });
    }
    
    // Skip email if explicitly requested
    if (skipEmail) {
      console.log('✅ [ROBUST-REJECT] Email notification skipped as requested');
      return;
    }
    
    // Fetch full quotation with customer details for email
    const { data: fullQuotationData, error: fullQuotationError } = await supabase
      .from('quotations')
      .select('*, customers(*), quotation_items(*)')
      .eq('id', id)
      .single();
      
    const fullQuotation = fullQuotationData as Quotation;
      
    if (fullQuotationError || !fullQuotation) {
      console.error('❌ [ROBUST-REJECT] Error fetching full quotation:', fullQuotationError);
      return;
    }
    
    // Fetch associated package and promotion for the PDF
    let selectedPackage: PricingPackage | null = null;
    const packageId = (fullQuotation as any).selected_package_id || (fullQuotation as any).package_id || (fullQuotation as any).pricing_package_id;
    if (packageId) {
        const { data: pkg } = await supabase.from('pricing_packages').select('*, items:pricing_package_items(*)').eq('id', packageId).single();
        selectedPackage = pkg as PricingPackage | null;
    }

    let selectedPromotion: PricingPromotion | null = null;
    const promotionCode = (fullQuotation as any).selected_promotion_code || (fullQuotation as any).promotion_code;
    if (promotionCode) {
        const { data: promo } = await supabase.from('pricing_promotions').select('*').eq('code', promotionCode).single();
        selectedPromotion = promo as PricingPromotion | null;
    }
    
    // Ensure we have a valid email address before proceeding
    const emailAddress = fullQuotation.customer_email || 
                      (fullQuotation.customers ? fullQuotation.customers.email : null);
    
    if (!emailAddress) {
      console.log('❌ [ROBUST-REJECT] No valid email address found for this quotation');
      return;
    }
    
    // Generate PDF
    console.log('🔄 [ROBUST-REJECT] Generating PDF...');
    let pdfBuffer;
    try {
      // Fetch the updated quotation to get the signature
      const { data: updatedQuotation } = await supabase
        .from('quotations')
        .select('*, quotation_items (*)')
        .eq('id', id)
        .single();
      
      // Generate optimized PDF using the new generator
      pdfBuffer = await generateOptimizedQuotationPDF(
        updatedQuotation || fullQuotation, 
        'en', 
        selectedPackage, 
        selectedPromotion
      );
      
      if (pdfBuffer) {
        console.log('✅ [ROBUST-REJECT] PDF generated successfully');
      } else {
        console.warn('⚠️ [ROBUST-REJECT] PDF generation returned null - continuing without PDF');
        pdfBuffer = null;
      }
    } catch (pdfError) {
      console.error('❌ [ROBUST-REJECT] PDF generation error:', pdfError);
      // Continue without PDF - don't fail the entire email process
      pdfBuffer = null;
    }
    
    // Send email notification
    try {
      console.log('🔄 [ROBUST-REJECT] Sending rejection email...');
      
      // Initialize Resend with API key
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Get email domain from env or fallback
      const emailDomain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com';
      
      // Get the public URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
      
      // Format quotation ID
      const formattedQuotationId = `QUO-JPDR-${fullQuotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
      
      // Use translation key for subject
      const emailSubject = `${t('email.quotation.rejected.subject')} - ${formattedQuotationId}`;
      
      // Customer name with fallback
      const customerName = (fullQuotation.customers ? fullQuotation.customers.name : null) || 
                         fullQuotation.customer_name || 
                         'Customer';
      
      // Generate styled email HTML using our helper function
      const emailHtml = generateEmailHtml('en', customerName, formattedQuotationId, fullQuotation, appUrl, reason);
      
      const { data: emailData, error: resendError } = await resend.emails.send({
        from: `Driver Japan <booking@${emailDomain}>`,
        to: [emailAddress],
        subject: emailSubject,
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
      
      console.log('✅ [ROBUST-REJECT] Email sent successfully:', emailData?.id);
      
      // Update last_email_sent_at
      await supabase
        .from('quotations')
        .update({ 
          last_email_sent_at: new Date().toISOString() 
        } as any)
        .eq('id', id);

      console.log('✅ [ROBUST-REJECT] Background processing completed successfully');

    } catch (emailError) {
      console.error('❌ [ROBUST-REJECT] Email sending error:', emailError);
    }
  } catch (error) {
    console.error('❌ [ROBUST-REJECT] Background processing failed:', error);
    
    // Log error to database
    try {
      const supabase = await getSupabaseServerClient();
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: id,
          user_id: 'system',
          action: 'rejection_error',
          details: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.error('❌ [ROBUST-REJECT] Failed to log error:', logError);
    }
  }
}
