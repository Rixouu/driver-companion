import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { Resend } from 'resend'
// Remove jsPDF dependency - we're using Puppeteer now
// Import our new HTML PDF generator
import { generatePdfFromHtml, generateQuotationHtml } from '@/lib/html-pdf-generator'

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

// Function to generate custom PDF using HTML-to-PDF approach
async function generateQuotationPDF(quotation: any, language: string): Promise<Buffer | null> {
  try {
    console.log('🔄 [SEND-REMINDER API] Starting PDF generation with HTML-to-PDF');
    
    // Generate the HTML for the quotation
    const htmlContent = generateQuotationHtml(quotation, language as 'en' | 'ja');
    
    // Convert the HTML to a PDF
    const pdfBuffer = await generatePdfFromHtml(htmlContent, {
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true
    });
    
    console.log('✅ [SEND-REMINDER API] PDF generation successful!');
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ [SEND-REMINDER API] Error during PDF generation:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('==================== SEND-REMINDER ROUTE START ====================');
  try {
    // Parse JSON request body
    const { id, language = 'en', includeQuotation = true } = await request.json();
    
    console.log(`[SEND-REMINDER API] Request data: id=${id}, language=${language}, includeQuotation=${includeQuotation}`);
    
    if (!id) {
      console.log('[SEND-REMINDER API] Missing quotation ID');
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }
    
    // Get template based on language
    const lang = language === 'ja' ? 'ja' : 'en';
    const template = reminderTemplates[lang];
    
    // Create service client (doesn't rely on cookies)
    console.log('[SEND-REMINDER API] Creating Supabase service client');
    let supabase;
    try {
      supabase = createServiceClient();
      console.log('[SEND-REMINDER API] Supabase service client created successfully');
    } catch (serviceClientError) {
      console.error('[SEND-REMINDER API] Error creating service client:', serviceClientError);
      return NextResponse.json(
        { error: 'Error connecting to database' },
        { status: 500 }
      );
    }
    
    // Fetch quotation data
    console.log(`[SEND-REMINDER API] Fetching quotation with ID: ${id}`);
    const { data: quotationData, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !quotationData) {
      console.error('[SEND-REMINDER API] Error fetching quotation data:', error);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    console.log(`[SEND-REMINDER API] Quotation fetched successfully. ID: ${quotationData.id}, Status: ${quotationData.status}`);
    
    // Use type assertion to handle potentially missing properties
    const quotation = quotationData as any;
    
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[SEND-REMINDER API] RESEND_API_KEY environment variable is not configured');
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
    const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
    
    // Create the quotation view URL
    const quotationUrl = `${appUrl}/quotations/${id}`;
    
    // Format quotation ID to use JPDR prefix
    const formattedQuotationId = `JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
    
    // Get customer email
    const customerEmail = quotation.customer_email || quotation.email;
    if (!customerEmail) {
      console.error('[SEND-REMINDER API] No customer email found in quotation');
      return NextResponse.json(
        { error: 'No customer email found in quotation' },
        { status: 400 }
      );
    }
    
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
      pdfBuffer = await generateQuotationPDF(quotation, language);
      
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
      subject: emailSubject,
      text: plainTextContent,
      html: emailContent
    };
    
    // Add attachment if PDF was generated
    if (pdfBuffer) {
      emailOptions.attachments = [{
        filename: `quotation-${formattedQuotationId}.pdf`,
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
        })
        .eq('id', id);
      
      // Log activity
      const userId = '00000000-0000-0000-0000-000000000000'; // System user for reminders
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: id,
          user_id: userId,
          action: 'reminder_sent',
          details: { 
            email: customerEmail,
            sent_at: now
          }
        });
      
      console.log('==================== SEND-REMINDER ROUTE END ====================');
      
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
    
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred in POST handler' },
      { status: 500 }
    );
  }
}

// Helper function to generate HTML email content
function generateReminderEmail(template: any, customerName: string, quotationId: string, quotationUrl: string, appUrl: string, logoUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${template.subject}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .content {
          background-color: #fff;
          padding: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #ff4b4b;
          color: white !important;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .logo {
          max-width: 150px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Driver Logo" class="logo">
        </div>
        <div class="content">
          <p>${template.greeting} ${customerName},</p>
          <p>${template.intro}</p>
          <p>${template.followup}</p>
          <p>${template.additionalInfo}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${quotationUrl}" class="button">${template.callToAction}</a>
          </div>
          <p>${template.closing}</p>
          <p>
            ${template.regards}<br>
            ${template.company}
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Driver (Thailand) Company Limited. All rights reserved.</p>
        </div>
      </div>
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