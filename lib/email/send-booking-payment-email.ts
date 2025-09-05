import { Resend } from 'resend';

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
      language = 'en'
    } = data;

    const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Required - Booking ${bookingId}</title>
        <style>
          body {
            font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #374151;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #FF2600 0%, #FF4500 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .booking-details {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .detail-label {
            font-weight: 600;
            color: #6b7280;
          }
          .detail-value {
            color: #111827;
          }
          .amount {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .amount-value {
            font-size: 28px;
            font-weight: 700;
            color: #92400e;
            margin: 0;
          }
          .payment-button {
            display: inline-block;
            background: #FF2600;
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: background-color 0.2s;
          }
          .payment-button:hover {
            background: #e02200;
          }
          .footer {
            background: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .warning {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #991b1b;
          }
          .warning-icon {
            display: inline-block;
            margin-right: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Required</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Booking #${bookingId}</p>
          </div>
          
          <div class="content">
            <p>Dear ${customerName},</p>
            
            <p>Thank you for your booking! To complete your reservation, please make a payment using the secure link below.</p>
            
            <div class="booking-details">
              <h3 style="margin-top: 0; color: #111827;">Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value">${formatDate(date)} at ${time}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup:</span>
                <span class="detail-value">${pickupLocation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Dropoff:</span>
                <span class="detail-value">${dropoffLocation}</span>
              </div>
            </div>
            
            <div class="amount">
              <p class="amount-value">${formatCurrency(amount, currency)}</p>
              <p style="margin: 5px 0 0 0; color: #92400e;">Total Amount Due</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${paymentLink}" class="payment-button">
                Pay Now Securely
              </a>
            </div>
            
            <div class="warning">
              <span class="warning-icon">⚠️</span>
              <strong>Important:</strong> This payment link will expire in 48 hours. Please complete your payment before the expiry time to secure your booking.
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>Driver Japan Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2025 Driver Japan. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data: emailData, error } = await resend.emails.send({
      from: 'Driver Japan <noreply@driver-japan.com>',
      to: [to],
      subject: `Payment Required - Booking #${bookingId}`,
      html: emailHtml,
    });

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
