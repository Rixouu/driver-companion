import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { Resend } from 'resend'
import { generateEmailTemplate } from '@/lib/email/email-partials'

const resend = new Resend(process.env.RESEND_API_KEY)

// Initialize Handlebars helpers
async function initializeHandlebars() {
  const Handlebars = (await import('handlebars')).default
  
  // Register Handlebars helpers
  Handlebars.registerHelper('formatCurrency', function(amount, currency) {
    if (!amount) return '0'
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency || 'JPY'
    }).format(numAmount)
  })

  Handlebars.registerHelper('eq', function(a, b) {
    return a === b
  })

  Handlebars.registerHelper('if_eq', function(this: any, a, b, options: any) {
    if (a === b) {
      return options.fn(this)
    }
    return options.inverse(this)
  })

  // Custom helper for language conditionals
  Handlebars.registerHelper('lang', function(lang, ...args) {
    if (args.length === 2) {
      // Simple case: lang, jaText, enText
      return lang === 'ja' ? args[0] : args[1]
    } else if (args.length === 6) {
      // Complex case: lang, jaPrefix, variable, jaSuffix, enPrefix, variable, enSuffix
      const [jaPrefix, variable, jaSuffix, enPrefix, enVariable, enSuffix] = args
      return lang === 'ja' ? `${jaPrefix}${variable}${jaSuffix}` : `${enPrefix}${enVariable}${enSuffix}`
    }
    return args[0] // fallback
  })
  
  return Handlebars
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const Handlebars = await initializeHandlebars()
    
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
      .select('*')
      .eq('wp_id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking not found' 
      }, { status: 404 })
    }

    // Get customer details
    const { data: customer } = await supabase
      .from('customers')
      .select('email, name')
      .eq('id', booking.customer_id!)
      .single()

    // Get driver details
    const { data: driver } = await supabase
      .from('drivers')
      .select('email, first_name, last_name, phone')
      .eq('id', booking.driver_id!)
      .single()

    // Get vehicle details
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('plate_number, brand, model, year')
      .eq('id', booking.vehicle_id!)
      .single()

    // Get creator details
    const { data: creator } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', booking.created_by!)
      .single()

    // Generate Google Calendar link
    const startDate = new Date(booking.date + 'T' + booking.time)
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)) // 2 hours duration
    
    const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Vehicle Service: ${booking.service_name}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}&details=Booking ID: ${booking.wp_id}%0AService: ${booking.service_name}%0APickup: ${booking.pickup_location || 'Location TBD'}%0ADropoff: ${booking.dropoff_location || 'Location TBD'}&location=${encodeURIComponent(`${booking.pickup_location || 'Location TBD'} to ${booking.dropoff_location || 'Location TBD'}`)}`

    // Generate Google Static Maps API URL for the route (same pattern as booking components)
    // Generate Google Static Maps API URL with better zoom and parameters
    const pickup = encodeURIComponent(booking.pickup_location || 'Tokyo, Japan')
    const dropoff = encodeURIComponent(booking.dropoff_location || 'Tokyo, Japan')
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x400&zoom=11&maptype=roadmap&markers=color:red%7Clabel:A%7C${pickup}&markers=color:green%7Clabel:B%7C${dropoff}&path=color:0x0000ff%7Cweight:5%7C${pickup}%7C${dropoff}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    
    // Generate Google Maps link for directions
    const googleMapsLink = `https://www.google.com/maps/dir/${pickup}/${dropoff}`
        // Get the proper email template from database
    const { data: template } = await supabase
      .from('notification_templates' as any)
      .select('html_content, subject')
      .eq('name', 'Trip Coming Soon Reminder')
      .single()

    if (!template) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email template not found' 
      }, { status: 404 })
    }

    // Prepare template variables
    const timeText = reminderType === '24h' ? '24 hours' : '2 hours'
    const urgencyText = reminderType === '2h' ? 'URGENT: ' : ''
    const hoursUntilTrip = reminderType === '24h' ? '24' : '2'
    
    // Prepare template data
    const templateData = {
      language: 'en', // Set to English
      customer_name: customer?.name || booking.customer_name,
      booking_id: booking.wp_id,
      booking_date: new Date(booking.date).toLocaleDateString(),
      hours_until_trip: hoursUntilTrip,
      service_name: booking.service_name,
      service_type_name: booking.service_type || 'Charter Services',
      vehicle_type: `${booking.vehicle_make} ${booking.vehicle_model}`,
      total_price: booking.price_amount || '0',
      currency: booking.price_currency || 'JPY',
      duration_hours: booking.duration_hours || 4,
      service_days: booking.service_days || 1,
      hours_per_day: booking.hours_per_day || 4,
      pickup_date: new Date(booking.date).toLocaleDateString(),
      pickup_time: booking.time,
      pickup_location: booking.pickup_location || 'Location TBD',
      dropoff_location: booking.dropoff_location || 'Location TBD',
      number_of_passengers: booking.number_of_passengers || 1,
      number_of_bags: booking.number_of_bags || 0,
      flight_number: booking.flight_number || '',
      terminal: booking.terminal || '',
      calendar_link: calendarLink,
      support_email: 'support@japandriver.com',
      // Driver details
      driver_name: driver ? `${driver.first_name} ${driver.last_name}` : 'Driver TBD',
      driver_email: driver?.email || 'driver@japandriver.com',
      driver_phone: driver?.phone || '+81-XX-XXXX-XXXX',
      // Vehicle details
      vehicle_make: (vehicle as any)?.brand || booking.vehicle_make || 'Vehicle',
      vehicle_model: (vehicle as any)?.model || booking.vehicle_model || 'Model',
      vehicle_year: (vehicle as any)?.year || booking.vehicle_year || '2023',
      vehicle_color: 'Black', // Default color since column doesn't exist
      vehicle_license_plate: (vehicle as any)?.plate_number || 'TBD',
      vehicle_class: 'Premium',
      // Map
      map_url: mapUrl,
      google_maps_link: googleMapsLink,
      // Route details
      distance: booking.distance || '16.0 km',
      duration: booking.duration || '19分',
      // For conditional logic
      booking_id_exists: !!booking.wp_id,
      pickup_location_exists: !!booking.pickup_location,
      number_of_passengers_exists: !!(booking.number_of_passengers && booking.number_of_passengers > 0),
      number_of_bags_exists: !!(booking.number_of_bags && booking.number_of_bags > 0),
      flight_number_exists: !!(booking.flight_number && booking.flight_number.length > 0),
      service_days_exists: !!(booking.service_days && booking.service_days > 1),
      service_type_charter: booking.service_type === 'Charter Services',
      service_type_airport: booking.service_type === 'Airport Transfer'
    }
    
    // Preprocess template to handle complex ternary operators
    let processedTemplate = (template as any).html_content
      // Handle the specific hours_until_trip case first - this is the critical one
      .replace(/\{\{language == "ja" \? "旅行開始まであと\{\{hours_until_trip\}\}時間です！" : "Only \{\{hours_until_trip\}\} hours until your trip starts!"\}\}/g, 'Only {{hours_until_trip}} hours until your trip starts!')
      // Handle simple ternary operators
      .replace(/\{\{language == "ja" \? "こんにちは" : "Hello"\}\}/g, 'Hello')
      .replace(/\{\{language == "ja" \? "お客様の旅行がもうすぐです！" : "Your trip is coming soon!"\}\}/g, 'Your trip is coming soon!')
      .replace(/\{\{language == "ja" \? "旅行リマインダー" : "Trip Reminder"\}\}/g, 'Trip Reminder')
      .replace(/\{\{language == "ja" \? "旅行詳細" : "Trip Details"\}\}/g, 'Trip Details')
      .replace(/\{\{language == "ja" \? "予約ID" : "Booking ID"\}\}/g, 'Booking ID')
      .replace(/\{\{language == "ja" \? "旅行日" : "Trip Date"\}\}/g, 'Trip Date')
      .replace(/\{\{language == "ja" \? "サービス詳細" : "SERVICE DETAILS"\}\}/g, 'SERVICE DETAILS')
      .replace(/\{\{language == "ja" \? "時間" : "Duration"\}\}/g, 'Duration')
      .replace(/\{\{language == "ja" \? "日時" : "Date & Time"\}\}/g, 'Date & Time')
      .replace(/\{\{language == "ja" \? "ピックアップ" : "Pickup"\}\}/g, 'Pickup')
      .replace(/\{\{language == "ja" \? "ドロップオフ" : "Drop-off"\}\}/g, 'Drop-off')
      .replace(/\{\{language == "ja" \? "乗客数" : "Passengers"\}\}/g, 'Passengers')
      .replace(/\{\{language == "ja" \? "バッグ数" : "Bags"\}\}/g, 'Bags')
      .replace(/\{\{language == "ja" \? "カレンダーに追加" : "Add to Calendar"\}\}/g, 'Add to Calendar')
      .replace(/\{\{language == "ja" \? "旅行をカレンダーに追加" : "Add your trip to your calendar"\}\}/g, 'Add your trip to your calendar')
      .replace(/\{\{language == "ja" \? "旅行をカレンダーに追加して、スケジュールを管理しましょう。" : "Add your trip to your calendar to keep track of your schedule."\}\}/g, 'Add your trip to your calendar to keep track of your schedule.')
      .replace(/\{\{language == "ja" \? "Googleカレンダーに追加" : "Add to Google Calendar"\}\}/g, 'Add to Google Calendar')
      .replace(/\{\{language == "ja" \? "お問い合わせ" : "Contact Information"\}\}/g, 'Contact Information')
      .replace(/\{\{language == "ja" \? "ご質問・サポート" : "Questions & Support"\}\}/g, 'Questions & Support')
      .replace(/\{\{language == "ja" \? "スムーズで楽しい体験を提供できることを楽しみにしています。ご質問がございましたら、お気軽にお問い合わせください。" : "We look forward to providing you with a smooth and enjoyable experience. If you have any questions, please do not hesitate to contact us."\}\}/g, 'We look forward to providing you with a smooth and enjoyable experience. If you have any questions, please do not hesitate to contact us.')
      .replace(/\{\{language == "ja" \? "サポートメール" : "Support Email"\}\}/g, 'Support Email')
      // Handle remaining ternary operators that might cause parsing errors
      .replace(/\{\{language == "ja" \? "フライト" : "Flight"\}\}/g, 'Flight')
      .replace(/\{\{language == "ja" \? "ターミナル" : "Terminal"\}\}/g, 'Terminal')
      .replace(/\{\{language == "ja" \? "金額" : "Amount"\}\}/g, 'Amount')
      .replace(/\{\{language == "ja" \? "日時" : "Date & Time"\}\}/g, 'Date & Time')
      .replace(/\{\{language == "ja" \? "時間" : "Duration"\}\}/g, 'Duration')
      .replace(/\{\{language == "ja" \? "予約ID" : "Booking ID"\}\}/g, 'Booking ID')
      .replace(/\{\{language == "ja" \? "旅行日" : "Trip Date"\}\}/g, 'Trip Date')
      .replace(/\{\{language == "ja" \? "サービス詳細" : "SERVICE DETAILS"\}\}/g, 'SERVICE DETAILS')
      .replace(/\{\{language == "ja" \? "ピックアップ" : "Pickup"\}\}/g, 'Pickup')
      .replace(/\{\{language == "ja" \? "ドロップオフ" : "Drop-off"\}\}/g, 'Drop-off')
      .replace(/\{\{language == "ja" \? "乗客数" : "Passengers"\}\}/g, 'Passengers')
      .replace(/\{\{language == "ja" \? "バッグ数" : "Bags"\}\}/g, 'Bags')
      .replace(/\{\{language == "ja" \? "カレンダーに追加" : "Add to Calendar"\}\}/g, 'Add to Calendar')
      .replace(/\{\{language == "ja" \? "旅行をカレンダーに追加" : "Add your trip to your calendar"\}\}/g, 'Add your trip to your calendar')
      .replace(/\{\{language == "ja" \? "旅行をカレンダーに追加して、スケジュールを管理しましょう。" : "Add your trip to your calendar to keep track of your schedule."\}\}/g, 'Add your trip to your calendar to keep track of your schedule.')
      .replace(/\{\{language == "ja" \? "Googleカレンダーに追加" : "Add to Google Calendar"\}\}/g, 'Add to Google Calendar')
      .replace(/\{\{language == "ja" \? "お問い合わせ" : "Contact Information"\}\}/g, 'Contact Information')
      .replace(/\{\{language == "ja" \? "ご質問・サポート" : "Questions & Support"\}\}/g, 'Questions & Support')
      .replace(/\{\{language == "ja" \? "スムーズで楽しい体験を提供できることを楽しみにしています。ご質問がございましたら、お気軽にお問い合わせください。" : "We look forward to providing you with a smooth and enjoyable experience. If you have any questions, please do not hesitate to contact us."\}\}/g, 'We look forward to providing you with a smooth and enjoyable experience. If you have any questions, please do not hesitate to contact us.')
      .replace(/\{\{language == "ja" \? "サポートメール" : "Support Email"\}\}/g, 'Support Email')
    
    // Debug: Log the processed template to see what's happening
    console.log('Processed template snippet:', processedTemplate.substring(0, 500))
    console.log('Template data language:', templateData.language)
    console.log('Template data hours_until_trip:', templateData.hours_until_trip)
    
    // Compile and render the template
    const templateCompiled = Handlebars.compile(processedTemplate)
    const emailBody = templateCompiled(templateData)
    
    // Debug: Log the rendered body to see what's happening
    console.log('Rendered email body snippet:', emailBody.substring(0, 500))
    
    // Generate the complete email using proper email partials
    const emailHtml = generateEmailTemplate({
      customerName: templateData.customer_name!,
      language: 'en',
      team: 'japan',
      title: 'Trip Reminder',
      subtitle: `${hoursUntilTrip} hours until your trip starts!`,
      content: emailBody,
      primaryColor: '#FF2800',
      secondaryColor: '#FF6B6B'
    })

    // Generate text version
    const emailText = `
      Your Trip is Coming Soon - ${booking.wp_id} (${timeText} reminder)

      Hello ${customer?.name || booking.customer_name},

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

      Driver Information:
      - Name: ${templateData.driver_name}
      - Phone: ${templateData.driver_phone}
      - Email: ${templateData.driver_email}
      - Status: Confirmed

      Vehicle Information:
      - Vehicle: ${templateData.vehicle_make} ${templateData.vehicle_model}
      - Year: ${templateData.vehicle_year}
      - Color: ${templateData.vehicle_color}
      - License Plate: ${templateData.vehicle_license_plate}
      - Class: ${templateData.vehicle_class}
      - Capacity: ${templateData.number_of_passengers} passengers

      Route Map: ${templateData.map_url}

      Add to Google Calendar: ${calendarLink}

      If you have any questions, please contact us at support@japandriver.com

      This is a test email sent for booking ${booking.wp_id} - ${timeText} reminder.
    `

    // Generate subject from template - fix the subject line to be in English
    let subject = (template as any).subject
      .replace(/\{\{language == "ja" \? "お客様の旅行がもうすぐです！" : "Your Trip is Coming Soon!"\}\}/g, 'Your Trip is Coming Soon!')
      .replace(/\{\{booking_id\}\}/g, booking.wp_id)
    
    // Add urgency prefix for 2h reminders
    if (reminderType === '2h') {
      subject = `URGENT: ${subject}`
    }

    // Send email to customer
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Driver Japan <booking@japandriver.com>',
      to: [customer?.email || booking.customer_email!],
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

    return NextResponse.json({ 
      success: true, 
      messageId: emailData?.id,
      message: `Trip reminder email sent successfully for booking ${booking.wp_id}`,
      bookingDetails: {
        wp_id: booking.wp_id,
        customer_name: customer?.name || booking.customer_name,
        customer_email: customer?.email || booking.customer_email,
        service_name: booking.service_name,
        date: booking.date,
        time: booking.time,
        pickup_location: booking.pickup_location,
        dropoff_location: booking.dropoff_location
      }
    })

  } catch (error) {
    console.error('Test trip reminder error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
