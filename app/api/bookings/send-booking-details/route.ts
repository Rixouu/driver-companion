import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [SEND-BOOKING-DETAILS] Starting email send process...')
    
    const { bookingId, bccEmails = [] } = await request.json()
    console.log('📝 [SEND-BOOKING-DETAILS] Request data:', { bookingId, bccEmails })

    if (!bookingId) {
      console.error('❌ [SEND-BOOKING-DETAILS] Missing booking ID')
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    console.log('🔌 [SEND-BOOKING-DETAILS] Creating Supabase client...')
    const supabase = createServiceClient()
    console.log('✅ [SEND-BOOKING-DETAILS] Supabase client created successfully')

    // Fetch booking details with customer information
    console.log('🔍 [SEND-BOOKING-DETAILS] Fetching booking data for ID:', bookingId)
    
    // Check if this looks like a WordPress ID (starts with letters and contains hyphens)
    const isWordPressId = /^[A-Z]+-\d+-\d+$/.test(bookingId)
    const searchField = isWordPressId ? 'wp_id' : 'id'
    
    console.log(`🔍 [SEND-BOOKING-DETAILS] ID format detected: ${isWordPressId ? 'WordPress ID' : 'UUID'}`)
    console.log(`🔍 [SEND-BOOKING-DETAILS] Searching by field: ${searchField}`)
    
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
      console.log(`🔍 [SEND-BOOKING-DETAILS] Not found by ${isWordPressId ? 'WordPress ID' : 'UUID'}, trying ${alternateField}...`)
      
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
        console.error(`❌ [SEND-BOOKING-DETAILS] Error fetching by ${alternateField}:`, altError)
        bookingError = altError
      } else {
        booking = altBooking
        console.log(`✅ [SEND-BOOKING-DETAILS] Found booking by ${alternateField}`)
      }
    }

    if (bookingError) {
      console.error('❌ [SEND-BOOKING-DETAILS] Error fetching booking:', bookingError)
      return NextResponse.json(
        { error: 'Database error while fetching booking', details: bookingError.message },
        { status: 500 }
      )
    }
    
    if (!booking) {
      console.error('❌ [SEND-BOOKING-DETAILS] No booking found with ID:', bookingId)
      console.log('🔍 [SEND-BOOKING-DETAILS] Attempting to debug by checking all bookings...')
      
      // Debug: Let's see what bookings exist
      const { data: allBookings, error: debugError } = await supabase
        .from('bookings')
        .select('id, wp_id, service_name, customer_name')
        .limit(5)
      
      if (debugError) {
        console.error('❌ [SEND-BOOKING-DETAILS] Debug query error:', debugError)
      } else {
        console.log('🔍 [SEND-BOOKING-DETAILS] Sample bookings in database:', allBookings)
      }
      
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ [SEND-BOOKING-DETAILS] Booking data fetched successfully:', {
      id: booking.id,
      wp_id: booking.wp_id,
      service_name: booking.service_name,
      customer_email: booking.customer_email,
      customers: booking.customers
    })

    // Get customer email from either the customers relation or direct field
    console.log('👤 [SEND-BOOKING-DETAILS] Processing customer data...')
    
    let customerEmail = booking.customer_email
    let customerName = booking.customer_name
    
    if (booking.customers && Array.isArray(booking.customers) && booking.customers.length > 0) {
      const customer = booking.customers[0]
      customerEmail = customer.email || customerEmail
      customerName = customer.name || customerName
      console.log('👥 [SEND-BOOKING-DETAILS] Customer data from relation:', {
        email: customer.email,
        name: customer.name
      })
    }
    
    // Ensure we have valid strings for the email generation
    customerEmail = customerEmail || 'customer@example.com'
    customerName = customerName || 'Customer'
    
    console.log('📧 [SEND-BOOKING-DETAILS] Final customer data:', {
      email: customerEmail,
      name: customerName
    })
    
    if (!customerEmail) {
      console.error('❌ [SEND-BOOKING-DETAILS] No customer email found')
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      )
    }

    // Generate Google Calendar link
    const startDate = new Date(booking.date + 'T' + booking.time)
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)) // 2 hours duration
    
    const calendarLink = generateGoogleCalendarLink({
      title: `Vehicle Service: ${booking.service_name}`,
      description: `Booking ID: ${booking.wp_id}\nService: ${booking.service_name}\nPickup: ${booking.pickup_location || 'Location TBD'}\nDropoff: ${booking.dropoff_location || 'Location TBD'}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location: `${booking.pickup_location || 'Location TBD'} to ${booking.dropoff_location || 'Location TBD'}`
    })

    // Generate email HTML
    const emailHtml = generateBookingDetailsEmailHtml({
      booking,
      customerEmail,
      customerName,
      calendarLink
    })

    // Generate plain text version
    const emailText = generateBookingDetailsEmailText({
      booking,
      customerEmail,
      customerName,
      calendarLink
    })

    // Prepare email payload
    const emailPayload: any = {
      from: 'Driver Japan <booking@japandriver.com>',
      to: [customerEmail],
      subject: `Your Booking Details - ${booking.wp_id}`,
      html: emailHtml,
      text: emailText
    }

    // Add BCC if provided
    if (bccEmails.length > 0) {
      emailPayload.bcc = bccEmails
    }

    // Send email
    console.log('📤 [SEND-BOOKING-DETAILS] Sending email via Resend...')
    console.log('📧 [SEND-BOOKING-DETAILS] Email payload:', {
      to: emailPayload.to,
      bcc: emailPayload.bcc,
      subject: emailPayload.subject
    })
    
    const { data: emailData, error: resendError } = await resend.emails.send(emailPayload)

    if (resendError) {
      console.error('❌ [SEND-BOOKING-DETAILS] Error sending email:', resendError)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }
    
    console.log('✅ [SEND-BOOKING-DETAILS] Email sent successfully:', emailData?.id)

    // Note: We don't update the booking table as it doesn't have email tracking fields
    // The email was sent successfully, which is the main goal

    console.log('🎉 [SEND-BOOKING-DETAILS] Process completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Booking details email sent successfully',
      emailId: emailData?.id
    })

  } catch (error) {
    console.error('💥 [SEND-BOOKING-DETAILS] Unexpected error:', error)
    console.error('💥 [SEND-BOOKING-DETAILS] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateGoogleCalendarLink({
  title,
  description,
  startDate,
  endDate,
  location
}: {
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
}) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startDate.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDate.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    details: description,
    location: location,
    ctz: 'Asia/Tokyo'
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function generateBookingDetailsEmailHtml({
  booking,
  customerEmail,
  customerName,
  calendarLink
}: {
  booking: any
  customerEmail: string
  customerName: string
  calendarLink: string
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
      <title>Your Booking Details</title>
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
        .details-table td, .details-table th {
          padding: 10px 0;
          font-size: 14px;
        }
        .details-table th {
           color: #8898AA;
           text-transform: uppercase;
           text-align: left;
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
        .notes {
          background-color: #f8f9fa;
          border-left: 4px solid #E03E2D;
          padding: 16px;
          margin: 16px 0;
          border-radius: 4px;
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
                          Your Booking Details
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
                    
                    <p>Here are the details of your upcoming vehicle service booking.</p>
                    
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
                      <h3>Driver & Vehicle Information</h3>
                      <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; gap: 30px; align-items: flex-start;">
                          <div style="width: 50%; min-width: 0;">
                            <h4 style="margin: 0 0 16px 0; color: #E03E2D; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">👤 Driver</h4>
                            <div style="margin-bottom: 16px;">
                              <div style="font-weight: 600; color: #32325D; margin-bottom: 4px;">Name:</div>
                              <div style="color: #525f7f;">${booking.drivers ? `${booking.drivers.first_name} ${booking.drivers.last_name}` : 'To be assigned'}</div>
                            </div>
                            <div style="margin-bottom: 0;">
                              <div style="font-weight: 600; color: #32325D; margin-bottom: 4px;">Phone:</div>
                              <div style="color: #525f7f;">${booking.drivers ? booking.drivers.phone : 'To be provided'}</div>
                            </div>
                          </div>
                          <div style="width: 50%; min-width: 0;">
                            <h4 style="margin: 0 0 16px 0; color: #E03E2D; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">🚗 Vehicle</h4>
                            <div style="margin-bottom: 16px;">
                              <div style="font-weight: 600; color: #32325D; margin-bottom: 4px;">License:</div>
                              <div style="color: #525f7f;">${booking.vehicles ? booking.vehicles.plate_number : 'To be assigned'}</div>
                            </div>
                            <div style="margin-bottom: 0;">
                              <div style="font-weight: 600; color: #32325D; margin-bottom: 4px;">Model:</div>
                              <div style="color: #525f7f;">${booking.vehicles ? `${booking.vehicles.brand} ${booking.vehicles.model}` : 'To be assigned'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    ${booking.notes ? `
                      <div class="notes">
                        <h4 style="margin:0 0 8px 0; color:#32325D;">Special Notes:</h4>
                        <p style="margin:0; color:#525f7f;">${booking.notes}</p>
                      </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin: 24px 0;">
                      <a href="${calendarLink}" class="button" style="background-color: #E03E2D; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        📅 Add to Google Calendar
                      </a>
                    </div>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 4px;">
                      <strong>Need to make changes?</strong><br>
                      Please contact us at least 24 hours before your scheduled service.
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

function generateBookingDetailsEmailText({
  booking,
  customerEmail,
  customerName,
  calendarLink
}: {
  booking: any
  customerEmail: string
  customerName: string
  calendarLink: string
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
Your Booking Details - ${booking.wp_id}

Hello ${customerName || 'there'}!

Here are the details of your upcoming vehicle service booking:

SERVICE DETAILS:
- Service Type: ${booking.service_name}
- Date: ${formatDate(booking.date)}
- Time: ${formatTime(booking.time)}
- Pickup Location: ${booking.pickup_location || 'Location TBD'}
- Dropoff Location: ${booking.dropoff_location || 'Location TBD'}

DRIVER & VEHICLE INFORMATION:
- Driver Name: ${booking.drivers ? `${booking.drivers.first_name} ${booking.drivers.last_name}` : 'To be assigned'}
- Driver Phone: ${booking.drivers ? booking.drivers.phone : 'To be provided'}
- License Plate: ${booking.vehicles ? booking.vehicles.plate_number : 'To be assigned'}
- Vehicle Model: ${booking.vehicles ? `${booking.vehicles.brand} ${booking.vehicles.model}` : 'To be assigned'}
${booking.notes ? `- Special Notes: ${booking.notes}` : ''}

Add to Google Calendar: ${calendarLink}

Need to make changes? Please contact us at least 24 hours before your scheduled service.

If you have any questions or need assistance, please don't hesitate to contact us.

Thank you for choosing Driver Japan!

Best regards,
Driver (Thailand) Company Limited
japandriver.com
  `
}
