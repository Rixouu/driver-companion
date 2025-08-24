import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
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
    const supabase = getSupabaseServerClient();
    
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
    const emailDomain = process.env.EMAIL_DOMAIN || 'driver.com';
    
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

      // Update quotation to mark magic link as sent
      await supabase
        .from('quotations')
        .update({ 
          magic_link_sent_at: new Date().toISOString(),
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

// Generate HTML email content
function generateEmailHtml(
  language: string, 
  customerName: string, 
  formattedQuotationId: string, 
  quotation: any, 
  appUrl: string,
  magicLink: string | null
): string {
  const template = emailTemplates[language as keyof typeof emailTemplates];
  
  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${template.subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
        .content { background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
        .magic-link-info { background: #e7f3ff; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; color: #007bff;">Driver Japan</h1>
        <p style="margin: 5px 0 0 0; color: #6c757d;">${template.subject}</p>
      </div>
      
      <div class="content">
        <p>${template.greeting} ${customerName},</p>
        
        <p>${template.intro}</p>
        
        <div class="magic-link-info">
          <h3 style="margin-top: 0; color: #007bff;">Quotation Details</h3>
          <p><strong>Quotation ID:</strong> ${formattedQuotationId}</p>
          <p><strong>Service:</strong> ${quotation.title || 'Transportation Service'}</p>
          <p><strong>Amount:</strong> ¥${quotation.amount?.toLocaleString() || 'N/A'}</p>
        </div>
        
        ${magicLink ? `
          <div style="text-align: center;">
            <a href="${magicLink}" class="button">View Your Quotation</a>
          </div>
          
          <div class="magic-link-info">
            <p><strong>Important:</strong> This magic link will expire in 7 days for security reasons.</p>
            <p>If you cannot click the button above, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">${magicLink}</p>
          </div>
        ` : `
          <p><em>Note: Magic link generation failed. Please contact support for assistance.</em></p>
        `}
        
        <p>${template.followup}</p>
        
        <p>${template.closing}</p>
        
        <p>${template.regards}<br>
        <strong>${template.company}</strong></p>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${quotation.customer_email}</p>
        <p>If you have any questions, please contact our support team.</p>
      </div>
    </body>
    </html>
  `;
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
