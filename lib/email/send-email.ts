import nodemailer from 'nodemailer';

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
  paymentLink: string;
  serviceName: string;
  pdfAttachment?: Buffer;
}

// Create reusable transporter
const createTransporter = () => {
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
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
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
  const { to, customerName, invoiceId, quotationId, amount, paymentLink, serviceName, pdfAttachment } = params;
  
  const subject = `Invoice #${invoiceId} for Your Booking`;
  
  // Plain text version
  const text = `
    Dear ${customerName},
    
    Thank you for choosing Japan Driver.
    
    Your invoice #${invoiceId} for ${serviceName} is attached to this email.
    
    Amount due: ¥${amount.toFixed(2)}
    
    To make payment, please use the following link:
    ${paymentLink}
    
    If you have any questions about this invoice, please contact us.
    
    Best regards,
    Japan Driver Team
  `;
  
  // HTML version
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #333366;">Your Invoice</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Dear ${customerName},</p>
        
        <p>Thank you for choosing Japan Driver.</p>
        
        <p>Your invoice <strong>#${invoiceId}</strong> for <strong>${serviceName}</strong> is attached to this email.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 5px 0;"><strong>Amount due:</strong> ¥${amount.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Reference:</strong> Quotation #${quotationId}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Pay Invoice Now
          </a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; font-size: 12px;">${paymentLink}</p>
        
        <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>Japan Driver Team</p>
      </div>
      
      <div style="background-color: #333366; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Japan Driver. All rights reserved.</p>
      </div>
    </div>
  `;
  
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