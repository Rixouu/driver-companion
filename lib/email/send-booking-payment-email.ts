import { Resend } from 'resend';
import { getTeamAddressHtml, getTeamFooterHtml } from '../team-addresses';

const resend = new Resend(process.env.RESEND_API_KEY);

interface BookingPaymentEmailData {
  to: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  pickupLocation: string;
  dropoffLocation: string;
  date: string;
  time: string;
  amount: number;
  currency: string;
  paymentLink: string;
  language?: string;
  pdfAttachment?: Buffer;
  bccEmails?: string;
  // Pricing breakdown
  baseAmount?: number;
  discountAmount?: number;
  regularDiscountAmount?: number;
  couponDiscountAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  discountPercentage?: number;
  taxPercentage?: number;
  couponCode?: string;
  couponDiscountPercentage?: number;
  // Service duration details
  duration_hours?: number;
  service_days?: number;
  hours_per_day?: number;
  // Team location
  teamLocation?: 'japan' | 'thailand';
  // Payment status
  paymentStatus?: 'PENDING PAYMENT' | 'PAID';
}

export async function sendBookingPaymentEmail(data: BookingPaymentEmailData) {
  try {
    const {
      to,
      customerName,
      bookingId,
      serviceName,
      pickupLocation,
      dropoffLocation,
      date,
      time,
      amount,
      currency,
      paymentLink,
      language = 'en',
      pdfAttachment,
      bccEmails = 'booking@japandriver.com',
      // Pricing breakdown
      baseAmount = amount,
      discountAmount = 0,
      regularDiscountAmount = 0,
      couponDiscountAmount = 0,
      taxAmount = 0,
      totalAmount = amount,
      discountPercentage = 0,
      taxPercentage = 10,
      couponCode = '',
      couponDiscountPercentage = 0,
      duration_hours = 0,
      service_days = 0,
      hours_per_day = 0,
      teamLocation = 'thailand',
      paymentStatus = 'PENDING PAYMENT'
    } = data;

    const formatCurrency = (amount: number) => {
      if (amount === undefined || amount === null) return `¥0`;
      
      if (currency === 'JPY' || currency === 'CNY') {
        return currency === 'JPY' 
          ? `¥${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
          : `CN¥${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      } else if (currency === 'THB') {
        return `฿${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      } else {
        try {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(amount);
        } catch (error) {
          // Fallback if currency code is invalid
          return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      }
    };

    // Use BOO-XXX format for subject
    const subject = `Payment for ${bookingId}`;
    
    // Check if payment link is provided to determine email type
    const hasPaymentLink = paymentLink && paymentLink.trim().length > 0;

    // Plain text version
    const text = hasPaymentLink ? `
      Dear ${customerName},
      
      We hope this email finds you well. Your invoice ${bookingId} is ready for payment, with all details and payment information provided below.
      
      Your invoice #${bookingId} for ${serviceName} is attached to this email.
      
      Amount due: ${typeof amount === 'number' ? amount.toFixed(2) : parseFloat(amount || '0').toFixed(2)} ${currency}
      
      To make payment, please use the following link:
      ${paymentLink}
      
      If you have any questions about this invoice, please contact us.
      
      Best regards,
      Japan Driver Team
    ` : `
      Dear ${customerName},
      
      We hope this email finds you well. Your invoice ${bookingId} is ready for payment, with all details and payment information provided below.
      
      Your invoice #${bookingId} for ${serviceName} is attached to this email.
      
      Amount due: ${typeof amount === 'number' ? amount.toFixed(2) : parseFloat(amount || '0').toFixed(2)} ${currency}
      
      An admin will send you an email with the payment link included very soon.
      
      If you have any questions about this invoice, please contact us.
      
      Best regards,
      Japan Driver Team
    `;
    
    // HTML version - EXACT COPY from quotation system
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my.japandriver.com';
    const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body style="margin:0; padding:0; background:#F2F4F6; font-family: 'Noto Sans Thai', 'Noto Sans', Arial, sans-serif;">
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
                            ${bookingId}
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
                      We hope this email finds you well. Your invoice is ready for payment, with all details and payment information provided below.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 24px 24px;">
                    <h3 style="margin:0 0 12px; font-size:16px; color:#32325D; text-transform: uppercase;">
                      Price Details
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="price-table"
                          style="background:#F8FAFC; border-radius:8px;">
                      <tr>
                        <td style="padding:12px;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <th align="left" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                                Description
                              </th>
                              <th align="right" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                                Price
                              </th>
                            </tr>
                            <tr>
                              <td style="padding-top: 15px;">${serviceName}${serviceName === 'Charter Services' && duration_hours > 0 && service_days > 0 ? ` (${service_days} day${service_days > 1 ? 's' : ''}, ${hours_per_day} hour${hours_per_day > 1 ? 's' : ''} per day)` : ''}</td>
                              <td align="right" style="padding-top: 15px;">${formatCurrency(baseAmount)}</td>
                            </tr>
                            ${regularDiscountAmount > 0 ? `
                            <tr>
                              <td style="padding-top: 15px; color: #e53e3e;">Discount (${discountPercentage}%)</td>
                              <td align="right" style="padding-top: 15px; color: #e53e3e;">-${formatCurrency(regularDiscountAmount)}</td>
                            </tr>
                            ` : ''}
                            ${couponDiscountAmount > 0 ? `
                            <tr>
                              <td style="padding-top: 15px; color: #10b981;">Coupon Discount (${couponCode})${couponDiscountPercentage > 0 ? ` (${couponDiscountPercentage}%)` : ''}</td>
                              <td align="right" style="padding-top: 15px; color: #10b981;">-${formatCurrency(couponDiscountAmount)}</td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="padding-top: 15px; font-weight: 500;">Subtotal</td>
                              <td align="right" style="padding-top: 15px; font-weight: 500;">${formatCurrency(baseAmount - regularDiscountAmount - couponDiscountAmount)}</td>
                            </tr>
                            ${taxAmount > 0 ? `
                            <tr>
                              <td style="padding-top: 15px;">Tax (${taxPercentage}%)</td>
                              <td align="right" style="padding-top: 15px;">+${formatCurrency(taxAmount)}</td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 700;">Total Amount Due</td>
                              <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 700;">${formatCurrency(totalAmount)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

${paymentStatus === 'PAID' ? `
                <tr>
                  <td style="padding:12px 24px 16px; text-align: center;">
                    <div style="background:#D1FAE5; border:1px solid #10B981; border-radius:8px; padding:16px; margin:0 auto; max-width:400px;">
                      <p style="margin:0; color:#065F46; font-size:14px; font-weight:600;">
                        ✅ Payment Received
                      </p>
                      <p style="margin:8px 0 0; color:#065F46; font-size:13px;">
                        Thank you for your payment. Your booking is confirmed.
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:6px 24px 16px; text-align:center; color:#32325D; font-size:13px;">
                    If you have any questions about this invoice, please reply to this email and our team will assist you.
                  </td>
                </tr>` : hasPaymentLink ? `
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
                </tr>` : `
                <tr>
                  <td style="padding:12px 24px 16px; text-align: center;">
                    <div style="background:#FEF3C7; border:1px solid #F59E0B; border-radius:8px; padding:16px; margin:0 auto; max-width:400px;">
                      <p style="margin:0; color:#92400E; font-size:14px; font-weight:600;">
                        📧 Payment Link Coming Soon
                      </p>
                      <p style="margin:8px 0 0; color:#92400E; font-size:13px;">
                        An admin will send you an email with the payment link included very soon.
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:6px 24px 16px; text-align:center; color:#32325D; font-size:13px;">
                    If you have any questions about this invoice, please reply to this email and our team will assist you.
                  </td>
                </tr>`}

                <tr>
                  <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-size:12px; color:#8898AA;">
                    ${getTeamFooterHtml(teamLocation, language === 'ja')}
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
      console.log('📎 [SEND-BOOKING-PAYMENT-EMAIL] Adding PDF attachment:', {
        filename: `Invoice-${bookingId}.pdf`,
        size: pdfAttachment.length,
        type: 'application/pdf'
      });
      attachments.push({
        filename: `Invoice-${bookingId}.pdf`,
        content: pdfAttachment,
        contentType: 'application/pdf',
      });
    } else {
      console.log('📎 [SEND-BOOKING-PAYMENT-EMAIL] No PDF attachment provided');
    }

    // Parse BCC emails
    const bccEmailList = bccEmails.split(',').map((email: string) => email.trim()).filter((email: string) => email);

    const emailPayload = {
      from: 'Driver Japan <booking@japandriver.com>',
      to: [to],
      bcc: bccEmailList,
      subject: subject,
      html: html,
      attachments: attachments
    };

    console.log('📧 [SEND-BOOKING-PAYMENT-EMAIL] Sending email with payload:', {
      to: emailPayload.to,
      bcc: emailPayload.bcc,
      subject: emailPayload.subject,
      attachmentsCount: emailPayload.attachments.length,
      hasAttachments: emailPayload.attachments.length > 0
    });

    const { data: emailData, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error('Error sending booking payment email:', error);
      return { success: false, error: error.message };
    }

    console.log('Booking payment email sent successfully:', emailData);
    return { success: true, messageId: emailData?.id };

  } catch (error) {
    console.error('Error in sendBookingPaymentEmail:', error);
    return { success: false, error: 'Failed to send email' };
  }
}