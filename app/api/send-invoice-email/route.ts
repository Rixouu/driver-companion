import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service-client'
import { mapSupabaseBookingToBooking } from '@/lib/api/bookings-service'

export async function POST(request: Request) {
  // Create a formdata object
  const formData = await request.formData()
  
  // Get email address and booking_id from the form data
  const email = formData.get('email') as string
  const bookingId = formData.get('booking_id') as string
  const includeDetails = formData.get('include_details') === 'true'
  
  // Get the PDF file from the form data
  const pdfFile = formData.get('invoice_pdf') as File
  
  if (!email || !pdfFile) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  
  try {
    // Get the real booking data from the database
    const supabase = createServiceClient()
    
    // First try to find by internal UUID
    let { data: bookingData } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle()
    
    // If not found, try to find by WordPress ID
    if (!bookingData) {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('wp_id', bookingId)
        .maybeSingle()
      
      bookingData = data
    }
    
    if (!bookingData) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    // Map to Booking type to use in the email
    const booking = mapSupabaseBookingToBooking(bookingData)
    
    // Convert the file to a buffer for attachment
    const arrayBuffer = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    // Get email domain from env or fallback
    const emailDomain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com'
    
    // Get the public URL for the Driver logo
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://japandriver.com'
    const logoUrl = `${appUrl}/img/driver-mini-logo.png`
    
    // Format price with currency
    const formattedAmount = booking.price?.formatted || 
      new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: booking.price?.currency || 'JPY'
      }).format(booking.price?.amount || 0)
    
    // Format date for display
    const bookingDate = booking.date || new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    
    // Get customer name with fallback
    const customerName = booking.customer_name || 'Customer'
    
    // Create localized time strings
    const pickupTimeFormatted = booking.time || '06:30 am'
    
    // Extract service info with fallbacks
    const serviceType = booking.service_name || 'Transportation Service'
    const vehicleInfo = booking.vehicle ? 
      `${booking.vehicle.make || ''} ${booking.vehicle.model || ''}`.trim() : 
      'Toyota Hiace Grand Cabin'
    
    // Payment link - using booking ID to construct the URL
    const paymentLink = booking.payment_link || `${appUrl}/bookings/${bookingId}/payment`
    
    // Send the email using Resend API
    const { data, error } = await resend.emails.send({
      from: `Japan Driver <booking@${emailDomain}>`,
      to: [email],
      subject: `Receipt from Japan Driver - #${bookingId}`,
      text: `Receipt from Japan Driver
Receipt #${bookingId}

AMOUNT PAID: ${formattedAmount}
DATE PAID: ${new Date().toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric'
})}

Thank you for your business! Your invoice is attached.

SERVICE TYPE: ${serviceType}
VEHICLE: ${vehicleInfo}
PICKUP DATE: ${bookingDate}
PICKUP TIME: ${pickupTimeFormatted}

ROUTE:
Pickup: ${booking.pickup_location || 'N/A'}
Drop-off: ${booking.dropoff_location || 'N/A'}

PAYMENT SUMMARY: ${formattedAmount}

If you have any questions about this receipt, please contact us at booking@japandriver.com.

Japan Driver Co., Ltd.
japandriver.com`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Receipt from Japan Driver</title>
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
    }
    @media only screen and (max-width:600px) {
      .container { width:100%!important; }
      .stack { display:block!important; width:100%!important; text-align:center!important; }
      .timeline { padding-left:0!important; }
    }
  </style>
</head>
<body style="background:#F2F4F6; margin:0; padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:24px;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#FFFFFF; border-radius:8px; overflow:hidden;">
          
          <!-- HEADER with white-circle badge -->
          <tr>
            <td style="background:linear-gradient(135deg,#E03E2D 0%,#F45C4C 100%);">
              <table width="100%" role="presentation">
                <tr>
                  <td align="center" style="padding:24px;">
                    <!-- white circular badge -->
                    <div style="
                      background:#FFFFFF;
                      border-radius:50%;
                      width:64px;
                      height:64px;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      margin:0 auto 12px;
                    ">
                      <img src="${logoUrl}" width="48" height="48" alt="Japan Driver logo" style="display:block;">
                    </div>
                    <h1 style="margin:0; font-size:24px; color:#FFF; font-weight:600;">Receipt from Japan Driver</h1>
                    <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                      Receipt #${bookingId}
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
                Hello ${customerName},<br><br>
                Thank you for choosing Japan Driver. Please find your receipt details below. We've attached a detailed invoice to this email for your records.
              </p>
            </td>
          </tr>
          
          <!-- DETAIL BLOCK -->
          <tr>
            <td style="padding:24px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#F8FAFC; border-radius:8px;">
                <tr>
                  <td style="width:30%; padding:16px 16px 8px 16px;">
                    <span style="font-size:14px; color:#8898AA; text-transform:uppercase;">SERVICE TYPE</span>
                  </td>
                  <td style="padding:16px 0;">
                    <span style="font-size:14px; color:#32325D;">${serviceType}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 16px 8px 16px;">
                    <span style="font-size:14px; color:#8898AA; text-transform:uppercase;">VEHICLE</span>
                  </td>
                  <td style="padding:16px 0;">
                    <span style="font-size:14px; color:#32325D;">${vehicleInfo}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 16px 8px 16px;">
                    <span style="font-size:14px; color:#8898AA; text-transform:uppercase;">PICKUP DATE</span>
                  </td>
                  <td style="padding:16px 0;">
                    <span style="font-size:14px; color:#32325D;">${bookingDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 16px 8px 16px;">
                    <span style="font-size:14px; color:#8898AA; text-transform:uppercase;">PICKUP TIME</span>
                  </td>
                  <td style="padding:16px 0;">
                    <span style="font-size:14px; color:#32325D;">${pickupTimeFormatted}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- ROUTE TIMELINE -->
          <tr>
            <td style="padding:0 24px 24px; color:#32325D;">
              <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif;">ROUTE</h3>
              <table width="100%" role="presentation">
                <tr>
                  <td class="timeline" width="24" valign="top" style="padding-right:12px;">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr><td width="8" height="8" style="background:#E03E2D; border-radius:4px;"></td></tr>
                      <tr><td width="2" height="32" style="background:#D9E2EC;"></td></tr>
                      <tr><td width="8" height="8" style="background:#32325D; border-radius:4px;"></td></tr>
                    </table>
                  </td>
                  <td valign="top" style="font-size:14px; line-height:1.4; font-family: Work Sans, sans-serif;">
                    <p style="margin:0 0 8px;"><strong>Pickup:</strong> ${booking.pickup_location || 'N/A'}<br>
                      <small style="color:#8898AA;">${booking.time || 'N/A'}</small></p>
                    <p style="margin:0;"><strong>Drop-off:</strong> ${booking.dropoff_location || 'N/A'}<br>
                      <small style="color:#8898AA;">${booking.duration ? `Estimated duration: ${booking.duration} minutes` : 'N/A'}</small></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- PAYMENT SUMMARY CARD -->
          <tr>
            <td style="padding:24px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#F8FAFC; border-radius:8px;">
                <tr>
                  <td style="padding:16px; font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
                    Payment Summary
                  </td>
                  <td style="padding:16px; font-size:16px; color:#32325D; font-weight:bold; text-align:right; font-family: Work Sans, sans-serif;">
                    ${formattedAmount}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 24px 24px;">
              <a href="${paymentLink}"
                 style="display:inline-block; padding:12px 24px; background:#E03E2D; color:#FFF;
                        text-decoration:none; border-radius:4px; font-family: Work Sans, sans-serif;
                        font-size:16px; font-weight:600;">
                View Booking Details
              </a>
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: Work Sans, sans-serif; font-size:12px; color:#8898AA;">
              <p style="margin:0 0 8px;">
                If you have any questions about this receipt, please contact us at<br>
                <a href="mailto:booking@japandriver.com" style="color:#E03E2D; text-decoration:none;">
                  booking@japandriver.com
                </a>
              </p>
              <p style="margin:0 0 4px;">Japan Driver Co., Ltd.</p>
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
</html>`,
      attachments: [
        {
          filename: `invoice-${bookingId}.pdf`,
          content: buffer
        }
      ]
    })
    
    if (error) {
      console.error('Resend API error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
} 