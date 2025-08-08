import nodemailer from 'nodemailer';
import { Resend } from 'resend';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: any[];
}

interface PaymentConfirmationParams {
  to: string;
  customerName: string;
  invoiceId: string;
  amount: number;
  serviceName: string;
}

interface InvoiceEmailParams {
  to: string;
  customerName: string;
  invoiceId: string;
  quotationId: string;
  amount: number;
  currencyCode?: string; // e.g., 'JPY', 'THB'
  paymentLink: string;
  serviceName: string;
  pdfAttachment?: Buffer;
}

// Create reusable transporter (fallback when Resend is not configured)
const createTransporter = () => {
  const isProd = process.env.NODE_ENV === 'production';

  // In development or when email env vars are missing, use a dev-safe transport
  if (!isProd || !process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      jsonTransport: true, // does not attempt network connection
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export async function sendEmail(params: EmailParams) {
  const { to, subject, html, text, attachments = [] } = params;
  
  try {
    // Prefer Resend if configured
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromAddress = `${process.env.EMAIL_FROM_NAME || 'Japan Driver'} <${process.env.EMAIL_FROM_ADDRESS || 'info@japandriver.com'}>`;
      // Convert NodeMailer-style attachments to Resend format
      const resendAttachments = attachments.map((a: any) => ({
        filename: a.filename,
        content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content,
        contentType: a.contentType || 'application/octet-stream'
      }));
      const result = await resend.emails.send({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        attachments: resendAttachments,
      });
      console.log('Resend email result:', result);
      return { success: true, messageId: (result as any)?.data?.id || 'resend' };
    }

    // Fallback to NodeMailer transport
    const transporter = createTransporter();
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Japan Driver'}" <${process.env.EMAIL_FROM_ADDRESS || 'info@japandriver.com'}>`,
      to,
      subject,
      html,
      text,
      attachments,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email send attempt:', info);
    return { success: true, messageId: (info as any).messageId || 'dev-transport' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendPaymentConfirmationEmail(params: PaymentConfirmationParams) {
  const { to, customerName, invoiceId, amount, serviceName } = params;
  
  const subject = `Payment Confirmed for Invoice #${invoiceId}`;
  
  // Plain text version
  const text = `
    Dear ${customerName},
    
    Thank you for your payment of ${amount.toFixed(2)} for Invoice #${invoiceId}.
    
    Your payment for "${serviceName}" has been successfully processed.
    
    We'll be in touch shortly with further details about your booking.
    
    Best regards,
    Japan Driver Team
  `;
  
  // HTML version
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #333366;">Payment Confirmed</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Dear ${customerName},</p>
        
        <p>Thank you for your payment of <strong>¥${amount.toLocaleString()}</strong> for Invoice <strong>#${invoiceId}</strong>.</p>
        
        <div style="background-color: #e9f7ef; border-left: 4px solid #2ecc71; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;">Your payment for "${serviceName}" has been successfully processed.</p>
        </div>
        
        <p>We'll be in touch shortly with further details about your booking.</p>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>Japan Driver Team</p>
      </div>
      
      <div style="background-color: #333366; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Japan Driver. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail({ to, subject, html, text });
}

export async function sendInvoiceEmail(params: InvoiceEmailParams) {
  const { to, customerName, invoiceId, quotationId, amount, currencyCode = 'JPY', paymentLink, serviceName, pdfAttachment } = params;

  // Avoid repeating the word "Invoice" if invoiceId already includes it
  const subject = `${invoiceId} - ${serviceName}`;
  
  // Plain text version
  const text = `
    Dear ${customerName},
    
    Thank you for choosing Japan Driver. Your invoice for your upcoming trip is attached to this email.
    
    Your invoice #${invoiceId} for ${serviceName} is attached to this email.
    
    Amount due: ${amount.toFixed(2)} ${currencyCode}
    
    To make payment, please use the following link:
    ${paymentLink}
    
    If you have any questions about this invoice, please contact us.
    
    Best regards,
    Japan Driver Team
  `;
  
  // HTML version
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
  const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
    </head>
    <body style="margin:0; padding:0; background:#F2F4F6; font-family: Work Sans, Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding:24px;">
            <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
                   style="background:#FFFFFF; border-radius:8px; overflow:hidden; max-width: 600px;">
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
                          Your Invoice
                        </h1>
                        <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                          ${invoiceId}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td>
                  <p style="color:#32325D; margin:24px 24px 8px; line-height:1.6; font-size: 14px;">
                    Hello ${customerName},
                  </p>
                  <p style="color:#32325D; margin:0 24px 16px; line-height:1.6; font-size: 14px;">
                    Thank you for choosing Japan Driver. Your invoice for your upcoming trip is attached to this email.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:0 24px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                         style="background:#F8FAFC; border-radius:8px;">
                    <tr>
                      <td style="padding:16px; font-size:14px; color:#32325D;">
                        <p style="margin:5px 0;"><strong>Service:</strong> ${serviceName}</p>
                        <p style="margin:5px 0;"><strong>Reference:</strong> ${quotationId}</p>
                        <p style="margin:5px 0;"><strong>Amount due:</strong> ${amount.toLocaleString()} ${currencyCode}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:12px 24px 6px; text-align: center; color:#32325D; font-size:13px;">
                  You can pay securely using the link below. If the button does not work, use the plain link further down.
                </td>
              </tr>

              <tr>
                <td style="padding:6px 24px 6px; text-align: center;">
                  <a href="${paymentLink}" style="display:inline-block; padding:12px 24px; background:#E03E2D; color:#FFF; text-decoration:none; border-radius:4px; font-size:16px; font-weight:600;">
                    Pay Invoice Now
                  </a>
                </td>
              </tr>

              <tr>
                <td style="padding:6px 24px 16px; text-align:center; color:#32325D; font-size:13px;">
                  If you have any questions about this invoice, please reply to this email and our team will assist you.
                </td>
              </tr>

              <tr>
                <td style="padding:0 24px 24px; text-align:center;">
                  <p style="margin:0; font-size:12px; color:#8898AA; word-break:break-all;">${paymentLink}</p>
                </td>
              </tr>

              <tr>
                <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-size:12px; color:#8898AA;">
                  <p style="margin:0 0 4px;">Driver (Thailand) Company Limited</p>
                  <p style="margin:0;"><a href="https://japandriver.com" style="color:#E03E2D; text-decoration:none;">japandriver.com</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
  
  const attachments = [];
  
  if (pdfAttachment) {
    attachments.push({
      filename: `Invoice-${invoiceId}.pdf`,
      content: pdfAttachment,
      contentType: 'application/pdf',
    });
  }
  
  return sendEmail({ to, subject, html, text, attachments });
} 