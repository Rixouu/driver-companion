import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    const { bookingId, reminderType = '24h' } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking ID is required' 
      }, { status: 400 })
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers:customer_id(email, name),
        drivers:driver_id(email, first_name, last_name),
        profiles:created_by(email, full_name)
      `)
      .eq('wp_id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking not found' 
      }, { status: 404 })
    }

    // Generate Google Calendar link
    const startDate = new Date(booking.date + 'T' + booking.time)
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)) // 2 hours duration
    
    const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Vehicle Service: ${booking.service_name}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}&details=Booking ID: ${booking.wp_id}%0AService: ${booking.service_name}%0APickup: ${booking.pickup_location || 'Location TBD'}%0ADropoff: ${booking.dropoff_location || 'Location TBD'}&location=${encodeURIComponent(`${booking.pickup_location || 'Location TBD'} to ${booking.dropoff_location || 'Location TBD'}`)}`

    // Generate email HTML
    const timeText = reminderType === '24h' ? '24 hours' : '2 hours'
    const urgencyText = reminderType === '2h' ? 'URGENT: ' : ''
    const hoursUntilTrip = reminderType === '24h' ? '24' : '2'
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hello ${booking.customer_name},</h2>
        <p>Your trip is coming soon!</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF2800;">
          <h3 style="margin: 0 0 15px 0; color: #92400e;">Trip Reminder</h3>
          <p style="margin: 0; color: #b91c1c; font-weight: 600;">Only ${hoursUntilTrip} hours until your trip starts!</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #2d3748;">Trip Details</h3>
          <div style="background: white; padding: 15px; border-radius: 6px;">
            <p><strong>Booking ID:</strong> ${booking.wp_id}</p>
            <p><strong>Service:</strong> ${booking.service_name}</p>
            <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.time}</p>
            <p><strong>Pickup:</strong> ${booking.pickup_location}</p>
            <p><strong>Dropoff:</strong> ${booking.dropoff_location}</p>
            <p><strong>Passengers:</strong> ${booking.number_of_passengers}</p>
            <p><strong>Bags:</strong> ${booking.number_of_bags}</p>
            <p><strong>Vehicle:</strong> ${booking.vehicle_make} ${booking.vehicle_model}</p>
            <p><strong>Duration:</strong> ${booking.duration}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${calendarLink}" style="background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Add to Google Calendar
          </a>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #2d3748;">Contact Information</h3>
          <p style="margin: 0; color: #4a5568;">If you have any questions, please contact us at support@japandriver.com</p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This is a test email sent for booking ${booking.wp_id} - ${timeText} reminder.
        </p>
      </div>
    `

    const emailText = `
      Your Trip is Coming Soon - ${booking.wp_id} (${timeText} reminder)

      Hello ${booking.customer_name},

      Your trip is coming soon!

      Only ${hoursUntilTrip} hours until your trip starts!

      Trip Details:
      - Booking ID: ${booking.wp_id}
      - Service: ${booking.service_name}
      - Date: ${new Date(booking.date).toLocaleDateString()}
      - Time: ${booking.time}
      - Pickup: ${booking.pickup_location}
      - Dropoff: ${booking.dropoff_location}
      - Passengers: ${booking.number_of_passengers}
      - Bags: ${booking.number_of_bags}
      - Vehicle: ${booking.vehicle_make} ${booking.vehicle_model}
      - Duration: ${booking.duration}

      Add to Google Calendar: ${calendarLink}

      If you have any questions, please contact us at support@japandriver.com

      This is a test email sent for booking ${booking.wp_id} - ${timeText} reminder.
    `

    const subject = `${urgencyText}Your Trip is Coming Soon - ${booking.wp_id} (${timeText} reminder)`

    // Send email to customer
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Driver Japan <booking@japandriver.com>',
      to: [booking.customer_email],
      subject,
      html: emailHtml,
      text: emailText
    })

    if (emailError) {
      return NextResponse.json({ 
        success: false, 
        error: `Failed to send email: ${emailError.message}` 
      }, { status: 500 })
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: `Trip reminder email sent - ${booking.wp_id}`,
        message: `${timeText} trip reminder email sent to customer for booking ${booking.wp_id}`,
        type: `booking_reminder_${reminderType}`,
        related_id: booking.id,
        is_read: false
      })

    return NextResponse.json({ 
      success: true, 
      messageId: emailData?.id,
      message: `Trip reminder email sent successfully for booking ${booking.wp_id}`
    })

  } catch (error) {
    console.error('Send trip reminder error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
