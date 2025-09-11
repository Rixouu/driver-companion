import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [SEND-BOOKING-INVOICE] Starting invoice email send process...')
    
    const { bookingId, bccEmails = [], customer_email } = await request.json()
    console.log('📝 [SEND-BOOKING-INVOICE] Request data:', { bookingId, bccEmails, customer_email })

    if (!bookingId) {
      console.error('❌ [SEND-BOOKING-INVOICE] Missing booking ID')
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    console.log('🔌 [SEND-BOOKING-INVOICE] Creating Supabase client...')
    const supabase = createServiceClient()
    console.log('✅ [SEND-BOOKING-INVOICE] Supabase client created successfully')

    // Fetch booking details with customer information
    console.log('🔍 [SEND-BOOKING-INVOICE] Fetching booking data for ID:', bookingId)
    
    // Check if this looks like a WordPress ID (starts with letters and contains hyphens)
    const isWordPressId = /^[A-Z]+-\d+-\d+$/.test(bookingId)
    const searchField = isWordPressId ? 'wp_id' : 'id'
    
    console.log(`🔍 [SEND-BOOKING-INVOICE] ID format detected: ${isWordPressId ? 'WordPress ID' : 'UUID'}`)
    console.log(`🔍 [SEND-BOOKING-INVOICE] Searching by field: ${searchField}`)
    
    let { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        ),
        drivers!bookings_driver_id_fkey (
          id,
          first_name,
          last_name,
          phone
        ),
        vehicles!bookings_vehicle_id_fkey (
          id,
          plate_number,
          brand,
          model
        )
      `)
      .eq(searchField, bookingId)
      .maybeSingle()
    
    if (!booking && !bookingError) {
      // If not found by the first method, try the other method
      const alternateField = isWordPressId ? 'id' : 'wp_id'
      console.log(`🔍 [SEND-BOOKING-INVOICE] Not found by ${isWordPressId ? 'WordPress ID' : 'UUID'}, trying ${alternateField}...`)
      
      const { data: altBooking, error: altError } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone
          ),
          drivers!bookings_driver_id_fkey (
            id,
            first_name,
            last_name,
            phone
          ),
          vehicles!bookings_vehicle_id_fkey (
            id,
            plate_number,
            brand,
            model
          )
        `)
        .eq(alternateField, bookingId)
        .maybeSingle()
      
      if (altError) {
        console.error(`❌ [SEND-BOOKING-INVOICE] Error fetching by ${alternateField}:`, altError)
        bookingError = altError
      } else {
        booking = altBooking
        console.log(`✅ [SEND-BOOKING-INVOICE] Found booking by ${alternateField}`)
      }
    }

    if (bookingError) {
      console.error('❌ [SEND-BOOKING-INVOICE] Error fetching booking:', bookingError)
      return NextResponse.json(
        { error: 'Database error while fetching booking', details: bookingError.message },
        { status: 500 }
      )
    }
    
    if (!booking) {
      console.error('❌ [SEND-BOOKING-INVOICE] No booking found with ID:', bookingId)
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ [SEND-BOOKING-INVOICE] Booking data fetched successfully:', {
      id: booking.id,
      wp_id: booking.wp_id,
      service_name: booking.service_name,
      customer_email: booking.customer_email,
      customers: booking.customers
    })

    // Get customer email from either the customers relation or direct field
    console.log('👤 [SEND-BOOKING-INVOICE] Processing customer data...')
    
    let customerEmail = customer_email || booking.customer_email
    let customerName = booking.customer_name
    
    if (booking.customers && Array.isArray(booking.customers) && booking.customers.length > 0) {
      const customer = booking.customers[0]
      customerEmail = customerEmail || customer.email
      customerName = customerName || customer.name
      console.log('👥 [SEND-BOOKING-INVOICE] Customer data from relation:', {
        email: customer.email,
        name: customer.name
      })
    }
    
    // Ensure we have valid strings for the email generation
    customerEmail = customerEmail || 'customer@example.com'
    customerName = customerName || 'Customer'
    
    console.log('📧 [SEND-BOOKING-INVOICE] Final customer data:', {
      email: customerEmail,
      name: customerName
    })
    
    if (!customerEmail) {
      console.error('❌ [SEND-BOOKING-INVOICE] No customer email found')
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      )
    }

    // Calculate pricing for invoice
    const baseAmount = (booking as any).base_amount || booking.price_amount || 0
    const discountPercentage = booking.discount_percentage || 0
    const taxPercentage = booking.tax_percentage || 10
    const couponCode = booking.coupon_code || ''

    // Calculate regular discount
    const regularDiscount = baseAmount * (discountPercentage / 100)

    // Calculate coupon discount
    let couponDiscount = 0
    let couponDiscountPercentage = 0
    if (couponCode) {
      // First try to use stored coupon discount percentage
      if ((booking as any).coupon_discount_percentage) {
        couponDiscountPercentage = (booking as any).coupon_discount_percentage
        couponDiscount = baseAmount * ((booking as any).coupon_discount_percentage / 100)
      } else {
        // Fallback to calculating from coupon code
        try {
          const { data: couponData } = await supabase
            .from('pricing_promotions')
            .select('discount_type, discount_value, is_active, start_date, end_date, maximum_discount, minimum_amount')
            .eq('code', couponCode)
            .eq('is_active', true)
            .single()

          if (couponData) {
            const now = new Date()
            const validFrom = couponData.start_date ? new Date(couponData.start_date) : null
            const validUntil = couponData.end_date ? new Date(couponData.end_date) : null

            if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
              if (!couponData.minimum_amount || baseAmount >= couponData.minimum_amount) {
                if (couponData.discount_type === 'percentage') {
                  couponDiscountPercentage = couponData.discount_value
                  couponDiscount = baseAmount * (couponData.discount_value / 100)
                  if (couponData.maximum_discount && couponDiscount > couponData.maximum_discount) {
                    couponDiscount = couponData.maximum_discount
                  }
                } else {
                  couponDiscount = Math.min(couponData.discount_value, baseAmount)
                  couponDiscountPercentage = (couponDiscount / baseAmount) * 100
                }
              }
            }
          }
        } catch (error) {
          console.error('Error validating coupon:', error)
        }
      }
    }

    // Total discount
    const totalDiscount = regularDiscount + couponDiscount

    // Subtotal after discounts
    const subtotal = Math.max(0, baseAmount - totalDiscount)

    // Calculate tax
    const tax = subtotal * (taxPercentage / 100)

    // Final total
    const total = subtotal + tax

    // Determine payment status for invoice
    const isPaid = booking.status === 'confirmed' || booking.payment_status === 'paid'
    const paymentStatus = isPaid ? 'PAID' : 'PENDING PAYMENT'

    // Generate PDF invoice
    let pdfBuffer: Buffer | undefined;
    try {
      console.log('📄 [SEND-BOOKING-INVOICE] Generating PDF invoice...');
      
      // Get the base URL for the current request
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                     process.env.NODE_ENV === 'production' ? 'https://japandriver.com' :
                     'http://localhost:3000';
      
      console.log('🌐 [SEND-BOOKING-INVOICE] Using base URL:', baseUrl);
      
      const pdfRequestData = {
        booking_id: booking.id,
        language: 'en'
      };
      
      console.log('📤 [SEND-BOOKING-INVOICE] PDF request data:', pdfRequestData);
      console.log('🔗 [SEND-BOOKING-INVOICE] PDF request URL:', `${baseUrl}/api/bookings/generate-invoice-pdf`);
      
      const pdfResponse = await fetch(`${baseUrl}/api/bookings/generate-invoice-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfRequestData)
      });
      
      console.log('📥 [SEND-BOOKING-INVOICE] PDF response status:', pdfResponse.status);

      if (pdfResponse.ok) {
        pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        console.log('✅ [SEND-BOOKING-INVOICE] PDF generated successfully');
      } else {
        const errorText = await pdfResponse.text();
        console.warn('❌ [SEND-BOOKING-INVOICE] Failed to generate PDF:', {
          status: pdfResponse.status,
          statusText: pdfResponse.statusText,
          error: errorText
        });
      }
    } catch (pdfError) {
      console.error('❌ [SEND-BOOKING-INVOICE] Error generating PDF:', pdfError);
    }

    // Generate simple email HTML
    const emailHtml = generateSimpleInvoiceEmailHtml({
      booking,
      customerName,
      paymentStatus
    })

    // Generate plain text version
    const emailText = generateSimpleInvoiceEmailText({
      booking,
      customerName,
      paymentStatus
    })

    // Prepare email payload
    const emailPayload: any = {
      from: 'Driver Japan <booking@japandriver.com>',
      to: [customerEmail],
      subject: `Invoice - Booking ${booking.wp_id}`,
      html: emailHtml,
      text: emailText
    }

    // Add PDF attachment if generated successfully
    if (pdfBuffer) {
      emailPayload.attachments = [{
        filename: `Invoice-${booking.wp_id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }];
    }

    // Add BCC if provided
    if (bccEmails.length > 0) {
      emailPayload.bcc = bccEmails
    }

    // Send email
    console.log('📤 [SEND-BOOKING-INVOICE] Sending email via Resend...')
    console.log('📧 [SEND-BOOKING-INVOICE] Email payload:', {
      to: emailPayload.to,
      bcc: emailPayload.bcc,
      subject: emailPayload.subject
    })
    
    const { data: emailData, error: resendError } = await resend.emails.send(emailPayload)

    if (resendError) {
      console.error('❌ [SEND-BOOKING-INVOICE] Error sending email:', resendError)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }
    
    console.log('✅ [SEND-BOOKING-INVOICE] Email sent successfully:', emailData?.id)
    console.log('🎉 [SEND-BOOKING-INVOICE] Process completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
      emailId: emailData?.id,
      paymentStatus
    })

  } catch (error) {
    console.error('💥 [SEND-BOOKING-INVOICE] Unexpected error:', error)
    console.error('💥 [SEND-BOOKING-INVOICE] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateSimpleInvoiceEmailHtml({
  booking,
  customerName,
  paymentStatus
}: {
  booking: any
  customerName: string
  paymentStatus: string
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

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Invoice - Booking ${booking.wp_id}</title>
      <style>
        body, table, td, a {
          -webkit-text-size-adjust:100%;
          -ms-text-size-adjust:100%;
          font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif;
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
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-paid {
          background-color: #d1fae5;
          color: #065f46;
        }
        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
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
        .pdf-notice {
          background-color: #e0f2fe;
          border-left: 4px solid #0288d1;
          padding: 16px;
          margin: 16px 0;
          border-radius: 4px;
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
                          Invoice
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
                    
                    <p>Please find your invoice for the vehicle service booking attached to this email.</p>
                    
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
                    
                    <div class="info-block">
                      <h3>Payment Status</h3>
                      <span class="status-badge ${paymentStatus === 'PAID' ? 'status-paid' : 'status-pending'}">
                        ${paymentStatus}
                      </span>
                    </div>
                    
                    <div class="pdf-notice">
                      <strong>📄 Invoice PDF Attached</strong><br>
                      Please find the detailed invoice PDF attached to this email with complete pricing breakdown and payment information.
                    </div>
                    
                    <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
                    
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

function generateSimpleInvoiceEmailText({
  booking,
  customerName,
  paymentStatus
}: {
  booking: any
  customerName: string
  paymentStatus: string
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

  return `
Invoice - Booking ${booking.wp_id}

Hello ${customerName || 'there'}!

Please find your invoice for the vehicle service booking attached to this email.

SERVICE DETAILS:
- Service Type: ${booking.service_name}
- Date: ${formatDate(booking.date)}
- Time: ${formatTime(booking.time)}
- Pickup Location: ${booking.pickup_location || 'Location TBD'}
- Dropoff Location: ${booking.dropoff_location || 'Location TBD'}

PAYMENT STATUS: ${paymentStatus}

INVOICE PDF ATTACHED:
Please find the detailed invoice PDF attached to this email with complete pricing breakdown and payment information.

If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for choosing Driver Japan!

Best regards,
Driver (Thailand) Company Limited
japandriver.com
  `
}
