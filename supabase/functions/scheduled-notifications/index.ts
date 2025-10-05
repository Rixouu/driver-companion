import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationData {
  type: string
  related_id: string
  title: string
  message: string
  user_id?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[Scheduled Notifications] Starting scheduled notification processing...')
    
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Process quotation expiry notifications
    await processQuotationExpiryNotifications(supabase)
    
    // Process booking reminder notifications
    await processBookingReminderNotifications(supabase)
    
    // Process trip reminder emails
    await processTripReminderEmails(supabase)
    
    console.log('[Scheduled Notifications] All scheduled notifications processed successfully')
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled notifications processed successfully',
        processed_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
    
  } catch (error) {
    console.error('[Scheduled Notifications] Error:', error)

  return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process scheduled notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/**
 * Process quotation expiry notifications
 */
async function processQuotationExpiryNotifications(supabase: any): Promise<void> {
  try {
    console.log('[Scheduled Notifications] Processing quotation expiry notifications...')

    // Get quotations expiring in 24 hours (haven't been notified yet)
    const { data: expiring24h } = await supabase
      .from('quotations')
      .select('*')
      .eq('status', 'sent')
      .gte('expiry_date', new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()) // 23h from now
      .lte('expiry_date', new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()) // 25h from now
      .is('converted_to_booking_id', null)

    if (expiring24h && expiring24h.length > 0) {
      for (const quotation of expiring24h) {
        // Check if we already sent 24h notification
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('type', 'quotation_expiring_24h')
          .eq('related_id', quotation.id)
          .single()

        if (!existing) {
          await createAdminNotification(supabase, {
            type: 'quotation_expiring_24h',
            related_id: quotation.id,
            title: `Quotation #${quotation.quote_number} expires in 24 hours`,
            message: `Quotation for ${quotation.customer_name} (${quotation.service_type}) expires tomorrow at ${new Date(quotation.expiry_date).toLocaleString()}`
          })
          console.log(`[Scheduled Notifications] Sent 24h expiry notification for quotation #${quotation.quote_number}`)
        }
      }
    }

    // Get quotations expiring in 2 hours (haven't been notified yet)
    const { data: expiring2h } = await supabase
      .from('quotations')
      .select('*')
      .eq('status', 'sent')
      .gte('expiry_date', new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString()) // 1.5h from now
      .lte('expiry_date', new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString()) // 2.5h from now
      .is('converted_to_booking_id', null)

    if (expiring2h && expiring2h.length > 0) {
      for (const quotation of expiring2h) {
        // Check if we already sent 2h notification
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('type', 'quotation_expiring_2h')
          .eq('related_id', quotation.id)
          .single()

        if (!existing) {
          await createAdminNotification(supabase, {
            type: 'quotation_expiring_2h',
            related_id: quotation.id,
            title: `Urgent: Quotation #${quotation.quote_number} expires in 2 hours`,
            message: `Quotation for ${quotation.customer_name} (${quotation.service_type}) expires soon at ${new Date(quotation.expiry_date).toLocaleString()}`
          })
          console.log(`[Scheduled Notifications] Sent 2h expiry notification for quotation #${quotation.quote_number}`)
        }
      }
    }

    // Mark expired quotations
    const { data: expired } = await supabase
      .from('quotations')
      .select('*')
      .eq('status', 'sent')
      .lt('expiry_date', new Date().toISOString())
      .is('converted_to_booking_id', null)

    if (expired && expired.length > 0) {
      for (const quotation of expired) {
        // Update status to expired
        await supabase
          .from('quotations')
          .update({ status: 'expired' })
          .eq('id', quotation.id)

        // Send expired notification
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('type', 'quotation_expired')
          .eq('related_id', quotation.id)
          .single()

        if (!existing) {
          await createAdminNotification(supabase, {
            type: 'quotation_expired',
            related_id: quotation.id,
            title: `Quotation #${quotation.quote_number} has expired`,
            message: `Quotation for ${quotation.customer_name} (${quotation.service_type}) expired at ${new Date(quotation.expiry_date).toLocaleString()}`
          })
          console.log(`[Scheduled Notifications] Marked quotation #${quotation.quote_number} as expired`)
        }
      }
    }

    console.log(`[Scheduled Notifications] Processed ${(expiring24h?.length || 0) + (expiring2h?.length || 0) + (expired?.length || 0)} quotation notifications`)
    
  } catch (error) {
    console.error('[Scheduled Notifications] Error processing quotation expiry notifications:', error)
    throw error
  }
}

/**
 * Process booking reminder notifications
 */
async function processBookingReminderNotifications(supabase: any): Promise<void> {
  try {
    console.log('[Scheduled Notifications] Processing booking reminder notifications...')

    // Get bookings starting in 24 hours
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
    const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1)

    const { data: bookings24h } = await supabase
      .from('bookings')
      .select('*')
      .in('status', ['confirmed', 'pending', 'assigned'])
      .gte('date', tomorrowStart.toISOString().split('T')[0])
      .lt('date', tomorrowEnd.toISOString().split('T')[0])

    if (bookings24h && bookings24h.length > 0) {
      for (const booking of bookings24h) {
        // Check if we already sent 24h notification
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('type', 'booking_reminder_24h')
          .eq('related_id', booking.id)
          .single()

        if (!existing) {
          await createAdminNotification(supabase, {
            type: 'booking_reminder_24h',
            related_id: booking.id,
            title: `Booking reminder: ${booking.service_name} tomorrow`,
            message: `Booking for ${booking.customer_name} (${booking.service_name}) is scheduled for tomorrow at ${booking.time}. Pickup: ${booking.pickup_location}`
          })
          console.log(`[Scheduled Notifications] Sent 24h reminder for booking ${booking.wp_id}`)
        }
      }
    }

    // Get bookings starting in 2 hours
    const now2h = new Date()
    const currentDate = now2h.toISOString().split('T')[0]

    const { data: bookings2h } = await supabase
      .from('bookings')
      .select('*')
      .in('status', ['confirmed', 'pending', 'assigned'])
      .eq('date', currentDate)

    if (bookings2h && bookings2h.length > 0) {
      for (const booking of bookings2h) {
        // Parse booking time and check if it's within 2 hours
        const [hours, minutes] = booking.time.split(':').map(Number)
        const bookingDateTime = new Date()
        bookingDateTime.setHours(hours, minutes, 0, 0)

        const timeDiff = bookingDateTime.getTime() - now2h.getTime()
        const hoursDiff = timeDiff / (1000 * 60 * 60)

        if (hoursDiff > 1.5 && hoursDiff < 2.5) {
          // Check if we already sent 2h notification
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('type', 'booking_reminder_2h')
            .eq('related_id', booking.id)
            .single()

          if (!existing) {
            await createAdminNotification(supabase, {
              type: 'booking_reminder_2h',
              related_id: booking.id,
              title: `Urgent: Booking starts in 2 hours - ${booking.service_name}`,
              message: `Booking for ${booking.customer_name} (${booking.service_name}) starts at ${booking.time}. Pickup: ${booking.pickup_location}`
            })
            console.log(`[Scheduled Notifications] Sent 2h reminder for booking ${booking.wp_id}`)
          }
        }
      }
    }

    console.log(`[Scheduled Notifications] Processed ${(bookings24h?.length || 0)} booking reminder notifications`)
    
  } catch (error) {
    console.error('[Scheduled Notifications] Error processing booking reminder notifications:', error)
    throw error
  }
}

/**
 * Process trip reminder emails
 */
async function processTripReminderEmails(supabase: any): Promise<void> {
  try {
    console.log('[Scheduled Notifications] Processing trip reminder emails...')

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    // Get bookings starting in 24 hours
    const now24h = new Date()
    const tomorrow = new Date(now24h.getTime() + 24 * 60 * 60 * 1000) // Add 24 hours
    
    // Create UTC date strings for tomorrow
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0]
    const tomorrowStartStr = tomorrowDateStr + 'T00:00:00.000Z'
    const tomorrowEndStr = tomorrowDateStr + 'T23:59:59.999Z'

    const { data: bookings24h } = await supabase
      .from('bookings')
      .select(`
        *,
        drivers:driver_id (
          first_name,
          last_name,
          phone,
          email
        ),
        vehicles:vehicle_id (
          plate_number,
          brand,
          model
        ),
        customers:customer_id (
          email,
          name
        )
      `)
      .in('status', ['confirmed', 'pending', 'assigned'])
      .gte('date', tomorrowStartStr)
      .lte('date', tomorrowEndStr)

    console.log(`[Scheduled Notifications] Query parameters:`, {
      tomorrowDateStr: tomorrowDateStr,
      tomorrowStartStr: tomorrowStartStr,
      tomorrowEndStr: tomorrowEndStr,
      currentDate: new Date().toISOString().split('T')[0]
    })

    if (bookings24h && bookings24h.length > 0) {
      console.log(`[Scheduled Notifications] Found ${bookings24h.length} bookings for 24h reminders`)
      for (const booking of bookings24h) {
        console.log(`[Scheduled Notifications] Processing booking ${booking.wp_id}:`, {
          id: booking.id,
          wp_id: booking.wp_id,
          drivers: booking.drivers,
          customers: booking.customers,
          driver_id: booking.driver_id,
          customer_id: booking.customer_id
        })
        
        // Check if we already sent 24h trip reminder email
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('type', 'booking_reminder_24h')
          .eq('related_id', booking.id)
          .like('title', '%Trip reminder email sent%')
          .single()

        if (!existing) {
          await sendTripReminderEmail(supabase, resend, booking, '24h')
          console.log(`[Scheduled Notifications] Sent 24h trip reminder email for booking ${booking.wp_id}`)
        }
      }
    } else {
      console.log(`[Scheduled Notifications] No bookings found for 24h reminders`)
    }

    // Get bookings starting in 2 hours
    const now2h = new Date()
    const currentDate = now2h.toISOString().split('T')[0]

    const { data: bookings2h } = await supabase
      .from('bookings')
      .select(`
        *,
        drivers:driver_id (
          first_name,
          last_name,
          phone,
          email
        ),
        vehicles:vehicle_id (
          plate_number,
          brand,
          model
        ),
        customers:customer_id (
          email,
          name
        )
      `)
      .in('status', ['confirmed', 'pending', 'assigned'])
      .eq('date', currentDate)

    if (bookings2h && bookings2h.length > 0) {
      for (const booking of bookings2h) {
        // Parse booking time and check if it's within 2 hours
        const [hours, minutes] = booking.time.split(':').map(Number)
        const bookingDateTime = new Date()
        bookingDateTime.setHours(hours, minutes, 0, 0)

        const timeDiff = bookingDateTime.getTime() - now2h.getTime()
        const hoursDiff = timeDiff / (1000 * 60 * 60)

        if (hoursDiff > 1.5 && hoursDiff < 2.5) {
          // Check if we already sent 2h trip reminder email
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('type', 'booking_reminder_2h')
            .eq('related_id', booking.id)
            .like('title', '%Trip reminder email sent%')
            .single()

          if (!existing) {
            await sendTripReminderEmail(supabase, resend, booking, '2h')
            console.log(`[Scheduled Notifications] Sent 2h trip reminder email for booking ${booking.wp_id}`)
          }
        }
      }
    }

    console.log(`[Scheduled Notifications] Processed trip reminder emails for ${(bookings24h?.length || 0) + (bookings2h?.length || 0)} bookings`)
    
  } catch (error) {
    console.error('[Scheduled Notifications] Error processing trip reminder emails:', error)
    throw error
  }
}

/**
 * Send trip reminder email
 */
async function sendTripReminderEmail(supabase: any, resend: any, booking: any, reminderType: '24h' | '2h'): Promise<void> {
  try {
    // Get booking creator (admin who created the booking)
    const { data: creator } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', booking.created_by)
      .single()

    if (!booking.customers?.email || !booking.drivers?.email || !creator?.email) {
      console.warn(`[Trip Reminder] Missing email data for booking ${booking.wp_id}`)
      console.warn(`[Trip Reminder] Debug - customers:`, booking.customers)
      console.warn(`[Trip Reminder] Debug - drivers:`, booking.drivers)
      console.warn(`[Trip Reminder] Debug - creator:`, creator)
      return
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
    const emailHtml = generateTripReminderEmailHtml({
      booking,
      customer: {
        email: booking.customers.email,
        name: booking.customer_name || 'Customer'
      },
      creator: {
        email: creator.email,
        name: creator.full_name || 'Admin'
      },
      driver: {
        email: booking.drivers.email,
        name: `${booking.drivers.first_name || ''} ${booking.drivers.last_name || ''}`.trim() || 'Driver'
      },
      reminderType,
      calendarLink
    })

    // Generate plain text version
    const emailText = generateTripReminderEmailText({
      booking,
      customer: {
        email: booking.customers.email,
        name: booking.customer_name || 'Customer'
      },
      creator: {
        email: creator.email,
        name: creator.full_name || 'Admin'
      },
      driver: {
        email: booking.drivers.email,
        name: `${booking.drivers.first_name || ''} ${booking.drivers.last_name || ''}`.trim() || 'Driver'
      },
      reminderType,
      calendarLink
    })

    // Determine subject based on reminder type
    const timeText = reminderType === '24h' ? '24 hours' : '2 hours'
    const urgencyText = reminderType === '2h' ? 'URGENT: ' : ''
    
    const subject = `${urgencyText}Your Trip is Coming Soon - ${booking.wp_id} (${timeText} reminder)`

    // Send single email with BCC to all recipients
    await resend.emails.send({
      from: 'Driver Japan <booking@japandriver.com>',
      to: [booking.customers.email],
      bcc: [
        creator.email,
        booking.drivers.email,
        'booking@japandriver.com'
      ],
      subject,
      html: emailHtml,
      text: emailText
    })

    // Create notification record
    await createAdminNotification(supabase, {
      type: `booking_reminder_${reminderType}`,
      related_id: booking.id,
      title: `Trip reminder email sent - ${booking.wp_id}`,
      message: `${timeText} trip reminder email sent to customer with BCC to creator, driver, and booking@japandriver.com for booking ${booking.wp_id}`
    })

    console.log(`✅ [Trip Reminder ${reminderType.toUpperCase()}] Trip reminder emails sent for booking ${booking.wp_id}`)
    
  } catch (error) {
    console.error(`❌ [Trip Reminder ${reminderType.toUpperCase()}] Error sending trip reminder email:`, error)
    throw error
  }
}

/**
 * Generate Google Calendar link
 */
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
    dates: `${startDate.replace(/[-:]/g, '').split('.')[0]}Z/${endDate.replace(/[-:]/g, '').split('.')[0]}Z`,
    details: description,
    location: location
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generate trip reminder email HTML
 */
function generateTripReminderEmailHtml({
  booking,
  customer,
  creator,
  driver,
  reminderType,
  calendarLink
}: any) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const timeText = reminderType === '24h' ? '24 hours' : '2 hours'
  const urgencyClass = reminderType === '2h' ? 'urgent' : ''
  const urgencyIcon = reminderType === '2h' ? '🚨' : '⏰'

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Trip Coming Soon - ${timeText} Reminder</title>
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
        .reminder-header {
          background: linear-gradient(135deg, #E03E2D 0%, #F45C4C 100%);
          color: white;
          padding: 24px;
          text-align: center;
          position: relative;
        }
        .reminder-badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .reminder-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .reminder-subtitle {
          font-size: 16px;
          opacity: 0.9;
          margin: 0;
        }
        .trip-countdown {
          background: #ffffff;
          border: 2px solid #E03E2D;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 24px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(224, 62, 45, 0.15);
        }
        .trip-countdown h2 {
          color: #E03E2D;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .trip-countdown p {
          color: #525f7f;
          font-size: 16px;
          margin: 0;
          font-weight: 500;
        }
        .urgent .trip-countdown {
          border-color: #DC2626;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
        }
        .urgent .trip-countdown h2 {
          color: #DC2626;
        }
      </style>
    </head>
    <body style="background:#F2F4F6; margin:0; padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding:24px;">
            <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
                   style="background:#FFFFFF; border-radius:8px; overflow:hidden; max-width: 600px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td class="reminder-header">
                  <div class="reminder-badge">
                    ${urgencyIcon} ${timeText} reminder
                  </div>
                  <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 16px;">
                    <tr><td align="center" valign="middle" style="text-align:center;">
                        <img src="https://japandriver.com/img/driver-invoice-logo.png" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
                    </td></tr>
                  </table>
                  <h1 class="reminder-title">Your Trip is Coming Soon</h1>
                  <p class="reminder-subtitle">Booking ID: ${booking.wp_id}</p>
                </td>
              </tr>
              
              <!-- Trip Countdown -->
              <tr>
                <td>
                  <div class="trip-countdown ${reminderType === '2h' ? 'urgent' : ''}">
                    <h2>${timeText.toUpperCase()} UNTIL YOUR TRIP</h2>
                    <p>${formatDate(booking.date)} at ${formatTime(booking.time)}</p>
                  </div>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding:32px 24px;">
                  <div class="greeting">
                    <p>Hello ${customer.name || 'there'}!</p>
                    
                    <p>This is a friendly reminder that your vehicle service is scheduled to begin in <strong>${timeText}</strong>.</p>
                    
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
                              <div style="font-weight: 600; color: #32325D; margin-bottom: 4px;">License Plate:</div>
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
                      <h4 style="margin:0 0 8px 0; color:#E03E2D;">Special Notes</h4>
                      <p style="margin:0; color:#525f7f;">${booking.notes}</p>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${calendarLink}" class="button" style="background-color: #E03E2D; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(224, 62, 45, 0.3); transition: all 0.3s ease;">
                        <span style="margin-right: 8px;">📅</span>Add to Google Calendar
                      </a>
                    </div>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <h4 style="margin:0 0 12px 0; color:#856404; font-size: 16px; font-weight: 600;">Important Reminders</h4>
                      <ul style="margin:0; padding-left:20px; color:#856404; line-height: 1.6;">
                        <li style="margin-bottom: 8px;">Please be ready at the pickup location 5 minutes before your scheduled time</li>
                        <li style="margin-bottom: 8px;">Have your ID ready for verification</li>
                        <li style="margin-bottom: 8px;">If you need to make changes, contact us immediately</li>
                        ${reminderType === '2h' ? '<li style="margin-bottom: 0;"><strong>URGENT:</strong> Your trip is starting very soon - please confirm you\'re ready!</li>' : ''}
                      </ul>
                    </div>
                    
                    <p style="margin: 24px 0 16px 0; color: #525f7f;">If you have any questions or need assistance, please don't hesitate to contact us.</p>
                    
                    <p style="margin: 0 0 24px 0; color: #32325D; font-weight: 600;">Thank you for choosing Driver Japan!</p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 8px 0; color: #8898AA; font-size: 14px; font-weight: 500;">Driver (Thailand) Company Limited</p>
                  <p style="margin: 0; color: #8898AA; font-size: 14px;">
                    <a href="https://japandriver.com" style="color: #E03E2D; text-decoration: none; font-weight: 500;">japandriver.com</a>
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

/**
 * Generate trip reminder email text
 */
function generateTripReminderEmailText({
  booking,
  customer,
  reminderType,
  calendarLink
}: any) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const timeText = reminderType === '24h' ? '24 hours' : '2 hours'
  const urgencyText = reminderType === '2h' ? 'URGENT: ' : ''

  return `
${urgencyText}Trip Coming Soon - ${timeText} Reminder - ${booking.wp_id}

Hello ${customer.name || 'there'}!

${urgencyText}This is a friendly reminder that your vehicle service is scheduled to begin in ${timeText}.

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

IMPORTANT REMINDERS:
- Please be ready at the pickup location 5 minutes before your scheduled time
- Have your ID ready for verification
- If you need to make changes, contact us immediately
${reminderType === '2h' ? '- URGENT: Your trip is starting very soon - please confirm you\'re ready!' : ''}

If you have any questions or need assistance, please don't hesitate to contact us.

Thank you for choosing Driver Japan!

Best regards,
Driver (Thailand) Company Limited
japandriver.com
  `
}

/**
 * Create admin notification for ALL admin users
 */
async function createAdminNotification(supabase: any, notificationData: NotificationData): Promise<void> {
  try {
    // Get ALL admin users from the admin_users table
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .in('role', ['ADMIN', 'admin'])

    if (adminError) {
      console.error('Error fetching admin users:', adminError)
      throw adminError
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.warn('No admin users found, skipping notification creation')
      return
    }

    console.log(`[Notification] Found ${adminUsers.length} admin users, creating notifications for all`)

    // Create notifications for ALL admin users
    const notifications = adminUsers.map(admin => ({
      type: notificationData.type,
      related_id: notificationData.related_id,
      title: notificationData.title,
      message: notificationData.message,
      user_id: admin.id,
      is_read: false,
      created_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) {
      console.error('Failed to create notifications:', error)
      throw error
    }

    console.log(`✅ [Notification] Created admin notifications for ${adminUsers.length} admin users`)
  } catch (error) {
    console.error('Error creating admin notifications:', error)
    throw error
  }
}