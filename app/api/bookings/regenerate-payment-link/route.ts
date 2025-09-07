import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from '@/lib/supabase/service-client';
import { OmiseClient } from "@/lib/omise-client";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 [REGENERATE-PAYMENT-LINK] Starting payment link regeneration...');
    
    const { 
      bookingId, 
      bccEmails = [],
      customer_email 
    } = await req.json();
    
    console.log('📝 [REGENERATE-PAYMENT-LINK] Request data:', { bookingId, bccEmails, customer_email });

    if (!bookingId) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Missing booking ID');
      return NextResponse.json(
        { error: "Missing required field: bookingId is required" },
        { status: 400 }
      );
    }

    // Get booking data from database
    const supabase = createServiceClient();
    console.log('✅ [REGENERATE-PAYMENT-LINK] Supabase client created successfully');
    
    // Check if this looks like a WordPress ID (starts with letters and contains hyphens)
    const isWordPressId = /^[A-Z]+-\d+-\d+$/.test(bookingId);
    const searchField = isWordPressId ? 'wp_id' : 'id';
    
    console.log(`🔍 [REGENERATE-PAYMENT-LINK] ID format detected: ${isWordPressId ? 'WordPress ID' : 'UUID'}`);
    console.log(`🔍 [REGENERATE-PAYMENT-LINK] Searching by field: ${searchField}`);
    
    let { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (
          name,
          email
        )
      `)
      .eq(searchField, bookingId)
      .maybeSingle();

    if (!bookingData && !bookingError) {
      // If not found by the first method, try the other method
      const alternateField = isWordPressId ? 'id' : 'wp_id';
      console.log(`🔍 [REGENERATE-PAYMENT-LINK] Not found by ${isWordPressId ? 'WordPress ID' : 'UUID'}, trying ${alternateField}...`);
      
      const { data: altBooking, error: altError } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (
            name,
            email
          )
        `)
        .eq(alternateField, bookingId)
        .maybeSingle();
      
      if (altError) {
        console.error(`❌ [REGENERATE-PAYMENT-LINK] Error fetching by ${alternateField}:`, altError);
        bookingError = altError;
      } else {
        bookingData = altBooking;
        console.log(`✅ [REGENERATE-PAYMENT-LINK] Found booking by ${alternateField}`);
      }
    }

    if (bookingError) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Error fetching booking:', bookingError);
      return NextResponse.json(
        { error: "Database error while fetching booking", details: bookingError.message },
        { status: 500 }
      );
    }

    if (!bookingData) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] No booking found with ID:', bookingId);
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    console.log('✅ [REGENERATE-PAYMENT-LINK] Booking data fetched successfully:', {
      id: bookingData.id,
      wp_id: bookingData.wp_id,
      service_name: bookingData.service_name,
      customer_email: bookingData.customer_email
    });

    // Get customer email
    let customerEmail = customer_email || bookingData.customer_email;
    let customerName = bookingData.customer_name;
    
    if (bookingData.customers && Array.isArray(bookingData.customers) && bookingData.customers.length > 0) {
      const customer = bookingData.customers[0];
      customerEmail = customerEmail || customer.email;
      customerName = customerName || customer.name;
    }
    
    customerEmail = customerEmail || 'customer@example.com';
    customerName = customerName || 'Customer';
    
    if (!customerEmail) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] No customer email found');
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      );
    }

    // Initialize Omise client
    const isTestMode = process.env.NODE_ENV === 'development' || process.env.OMISE_TEST_MODE === 'true';
    const omiseClient = new OmiseClient({
      publicKey: isTestMode 
        ? (process.env.OMISE_TEST_PUBLIC_KEY || process.env.OMISE_PUBLIC_KEY || 'pkey_63znvleq75487yf61ea')
        : (process.env.OMISE_PUBLIC_KEY || 'pkey_63znvleq75487yf61ea'),
      secretKey: isTestMode 
        ? (process.env.OMISE_TEST_SECRET_KEY || process.env.OMISE_SECRET_KEY || 'skey_64t36zji5r1yloelbv2')
        : (process.env.OMISE_SECRET_KEY || 'skey_64t36zji5r1yloelbv2'),
      baseUrl: process.env.OMISE_API_URL || 'https://api.omise.co'
    });
    
    console.log(`[REGENERATE-PAYMENT-LINK] Using ${isTestMode ? 'TEST' : 'PRODUCTION'} credentials`);

    // Use booking amount
    const amount = bookingData.price_amount || bookingData.base_amount || 0;
    const currency = 'JPY';

    // Validate amount
    if (amount <= 0) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Invalid amount calculated:', { amount, bookingData });
      return NextResponse.json(
        { error: 'Invalid amount calculated. Please check booking pricing.' },
        { status: 400 }
      );
    }

    // Create payment link data
    const serviceDescription = bookingData.service_name || 'Transportation Service';
    const bookingNumber = bookingData.wp_id || bookingData.id;
    
    const defaultDescription = `${customerName} - ${serviceDescription} - Booking ${bookingNumber}`;
    
    const paymentLinkData = {
      amount: amount,
      currency: currency,
      description: defaultDescription,
      reference: `BOOK-${bookingNumber}`,
      customerEmail: customerEmail,
      customerName: customerName,
      expiryHours: 48, // 48 hours expiry
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app'}/bookings/${bookingData.id}`
    };

    console.log('💳 [REGENERATE-PAYMENT-LINK] Payment link data:', paymentLinkData);

    // Generate payment link
    const result = await omiseClient.createPaymentLink(paymentLinkData);

    if (result.error) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Error creating payment link:', result.error);
      return NextResponse.json(
        { error: result.message || 'Failed to generate payment link' },
        { status: 400 }
      );
    }

    console.log('✅ [REGENERATE-PAYMENT-LINK] Payment link created successfully:', result.paymentUrl);

    // Update booking with payment link
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        payment_link: result.paymentUrl,
        payment_link_generated_at: new Date().toISOString(),
        payment_link_expires_at: new Date(Date.now() + (48 * 60 * 60 * 1000)).toISOString()
      })
      .eq('id', bookingData.id);

    if (updateError) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Failed to update booking with payment link:', updateError);
      // Don't fail the request, just log the error
    } else {
      console.log('✅ [REGENERATE-PAYMENT-LINK] Booking updated with new payment link');
    }

    // Generate email HTML
    const emailHtml = generatePaymentLinkEmailHtml({
      booking: bookingData,
      customerEmail,
      customerName,
      paymentLink: result.paymentUrl,
      amount,
      currency
    });

    // Generate plain text version
    const emailText = generatePaymentLinkEmailText({
      booking: bookingData,
      customerEmail,
      customerName,
      paymentLink: result.paymentUrl,
      amount,
      currency
    });

    // Prepare email payload
    const emailPayload: any = {
      from: 'Driver Japan <booking@japandriver.com>',
      to: [customerEmail],
      subject: `Payment Link - Booking ${bookingNumber}`,
      html: emailHtml,
      text: emailText
    };

    // Add BCC if provided
    if (bccEmails.length > 0) {
      emailPayload.bcc = bccEmails;
    }

    // Send email
    console.log('📤 [REGENERATE-PAYMENT-LINK] Sending email via Resend...');
    console.log('📧 [REGENERATE-PAYMENT-LINK] Email payload:', {
      to: emailPayload.to,
      bcc: emailPayload.bcc,
      subject: emailPayload.subject
    });
    
    const { data: emailData, error: resendError } = await resend.emails.send(emailPayload);

    if (resendError) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Error sending email:', resendError);
      // Don't fail the request, just log the error
    } else {
      console.log('✅ [REGENERATE-PAYMENT-LINK] Email sent successfully:', emailData?.id);
    }

    console.log('🎉 [REGENERATE-PAYMENT-LINK] Process completed successfully');

    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
      chargeId: result.chargeId,
      amount: amount,
      currency: currency,
      expiresAt: new Date(Date.now() + (48 * 60 * 60 * 1000)).toISOString(),
      emailId: emailData?.id
    });

  } catch (error) {
    console.error('💥 [REGENERATE-PAYMENT-LINK] Unexpected error:', error);
    console.error('💥 [REGENERATE-PAYMENT-LINK] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to regenerate payment link' },
      { status: 500 }
    );
  }
}

function generatePaymentLinkEmailHtml({
  booking,
  customerEmail,
  customerName,
  paymentLink,
  amount,
  currency
}: {
  booking: any
  customerEmail: string
  customerName: string
  paymentLink: string
  amount: number
  currency: string
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Payment Link - Booking ${booking.wp_id}</title>
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
          .info-block .flex { flex-direction: column!important; gap: 15px!important; }
          .info-block .flex > div { width: 100%!important; }
          .info-block .flex .flex { flex-direction: column!important; gap: 15px!important; }
          .info-block .flex .flex > div { width: 100%!important; }
        }
        .button {
          background-color: #E03E2D;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          display: inline-block;
          margin: 16px 0;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .info-block {
          background:#f8f9fa; 
          padding:20px; 
          border-radius:8px; 
          margin:20px 0;
        }
        .info-block h3 {
          margin:0 0 12px 0; 
          color:#32325D;
        }
        .info-block p {
          margin:0; 
          color:#525f7f;
        }
        .info-block strong {
          color: #32325D;
        }
        .payment-amount {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          margin: 16px 0;
          border-radius: 4px;
          text-align: center;
        }
        .payment-amount .amount {
          font-size: 24px;
          font-weight: 600;
          color: #92400e;
        }
      </style>
    </head>
    <body style="background:#F2F4F6; margin:0; padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding:24px;">
            <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
                   style="background:#FFFFFF; border-radius:8px; overflow:hidden; max-width: 600px;">
              
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#E03E2D 0%,#F45C4C 100%);">
                  <table width="100%" role="presentation">
                    <tr>
                      <td align="center" style="padding:24px;">
                        <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 12px;">
                          <tr><td align="center" valign="middle" style="text-align:center;">
                              <img src="https://japandriver.com/img/driver-invoice-logo.png" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
                          </td></tr>
                        </table>
                        <h1 style="margin:0; font-size:24px; color:#FFF; font-weight:600;">
                          Payment Link
                        </h1>
                        <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                          Booking ID: ${booking.wp_id}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding:32px 24px;">
                  <div class="greeting">
                    <p>Hello ${customerName || 'there'},</p>
                    
                    <p>A new payment link has been generated for your vehicle service booking.</p>
                    
                    <div class="info-block">
                      <h3>Service Details</h3>
                      <p>
                        <strong>Service Type:</strong> ${booking.service_name}<br>
                        <strong>Date:</strong> ${formatDate(booking.date)}<br>
                        <strong>Time:</strong> ${formatTime(booking.time)}<br>
                        <strong>Pickup Location:</strong> ${booking.pickup_location || 'Location TBD'}<br>
                        <strong>Dropoff Location:</strong> ${booking.dropoff_location || 'Location TBD'}
                      </p>
                    </div>
                    
                    <div class="payment-amount">
                      <div style="font-size: 14px; color: #92400e; margin-bottom: 8px;">Amount to Pay</div>
                      <div class="amount">${formatCurrency(amount)}</div>
                    </div>
                    
                    <div style="text-align: center; margin: 24px 0;">
                      <a href="${paymentLink}" class="button" style="background-color: #E03E2D; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        💳 Pay Now
                      </a>
                    </div>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 4px;">
                      <strong>Payment Link Expires:</strong><br>
                      This payment link will expire in 48 hours for security reasons.
                    </div>
                    
                    <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
                    
                    <p>Thank you for choosing Driver Japan!</p>
                    
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background:#f8f9fa; padding:24px; text-align:center;">
                  <p style="margin:0; color:#8898AA; font-size:12px;">
                    Driver (Thailand) Company Limited<br>
                    <a href="https://japandriver.com" style="color:#E03E2D; text-decoration:none;">japandriver.com</a>
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

function generatePaymentLinkEmailText({
  booking,
  customerEmail,
  customerName,
  paymentLink,
  amount,
  currency
}: {
  booking: any
  customerEmail: string
  customerName: string
  paymentLink: string
  amount: number
  currency: string
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  return `
Payment Link - Booking ${booking.wp_id}

Hello ${customerName || 'there'}!

A new payment link has been generated for your vehicle service booking.

SERVICE DETAILS:
- Service Type: ${booking.service_name}
- Date: ${formatDate(booking.date)}
- Time: ${formatTime(booking.time)}
- Pickup Location: ${booking.pickup_location || 'Location TBD'}
- Dropoff Location: ${booking.dropoff_location || 'Location TBD'}

AMOUNT TO PAY: ${formatCurrency(amount)}

Pay Now: ${paymentLink}

IMPORTANT: This payment link will expire in 48 hours for security reasons.

If you have any questions or need assistance, please don't hesitate to contact us.

Thank you for choosing Driver Japan!

Best regards,
Driver (Thailand) Company Limited
japandriver.com
  `
}
