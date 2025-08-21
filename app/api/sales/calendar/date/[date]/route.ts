import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params
    const supabase = await getSupabaseServerClient()

    // Use the EXACT same approach as the main sales calendar page
    console.log(`Fetching events for date: ${date}`)
    
    // Fetch quotations - using the same query as main calendar
    const { data: allQuotations = [], error: quotationsError } = await supabase
      .from('quotations')
      .select(`
        id,
        title,
        customer_name,
        customer_email,
        pickup_date,
        pickup_time,
        status,
        total_amount,
        currency,
        vehicle_type,
        service_type,
        merchant_notes,
        created_at
      `)
      .order('pickup_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (quotationsError) {
      console.error('Error fetching quotations:', quotationsError)
    }

    // Fetch bookings - using the same query as main calendar
    const { data: allBookings = [], error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_name,
        customer_email,
        date,
        time,
        status,
        price_amount,
        price_currency,
        service_name,
        service_type,
        vehicle_make,
        vehicle_model,
        notes,
        created_at
      `)
      .order('date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
    }

    // Filter and transform events for the specific date - using SAME logic as main calendar
    const transformedEvents: any[] = []

    // Transform quotations - filter by target date
    console.log(`Processing ${allQuotations?.length || 0} quotations for date ${date}`)
    allQuotations?.forEach((quotation) => {
      // Use the same logic as the sales calendar: quotation.pickup_date || quotation.created_at
      const eventDate = quotation.pickup_date || quotation.created_at
      
      // Check if this quotation is for the target date
      if (eventDate) {
        // Convert to local date (Japan timezone UTC+9) for comparison
        const eventDateObj = new Date(eventDate)
        // Convert UTC to Japan timezone by adding 9 hours
        const localEventDate = new Date(eventDateObj.getTime() + (9 * 60 * 60 * 1000))
        const eventDateStr = localEventDate.toISOString().split('T')[0]
        console.log(`Quotation ${quotation.id}: eventDate=${eventDate}, localDate=${localEventDate.toISOString()}, eventDateStr=${eventDateStr}, targetDate=${date}, match=${eventDateStr === date}`)
        if (eventDateStr === date) {
          transformedEvents.push({
            id: quotation.id,
            type: 'quotation',
            title: quotation.title || `Quote for ${quotation.customer_name}`,
            customer_name: quotation.customer_name || 'Unknown Customer',
            customer_email: quotation.customer_email,
            date: eventDate,
            pickup_date: quotation.pickup_date,
            pickup_time: quotation.pickup_time,
            status: quotation.status || 'draft',
            total_amount: quotation.total_amount,
            currency: quotation.currency || 'JPY',
            vehicle_type: quotation.vehicle_type,
            service_type: quotation.service_type,
            notes: quotation.merchant_notes,
            location: 'Location not specified'
          })
        }
      }
    })

    // Transform bookings - filter by target date
    console.log(`Processing ${allBookings?.length || 0} bookings for date ${date}`)
    allBookings?.forEach((booking) => {
      // Check if this booking is for the target date
      if (booking.date === date) {
        transformedEvents.push({
          id: booking.id,
          type: 'booking',
          title: `Booking for ${booking.customer_name}`,
          customer_name: booking.customer_name || 'Unknown Customer',
          customer_email: booking.customer_email,
          date: booking.date || booking.created_at,
          pickup_date: booking.date,
          pickup_time: booking.time,
          status: booking.status || 'confirmed',
          total_amount: booking.price_amount,
          currency: booking.price_currency || 'JPY',
          vehicle_type: booking.vehicle_make && booking.vehicle_model ? `${booking.vehicle_make} ${booking.vehicle_model}` : 'Vehicle',
          service_type: booking.service_name || booking.service_type,
          notes: booking.notes,
          location: 'Location not specified'
        })
      }
    })

    // Debug logging
    console.log(`Date: ${date}`)
    console.log(`Total quotations: ${allQuotations?.length || 0}`)
    console.log(`Total bookings: ${allBookings?.length || 0}`)
    console.log(`Filtered events for date: ${transformedEvents.length}`)
    console.log('Event types:', transformedEvents.map(e => e.type))

    return NextResponse.json({ 
      events: transformedEvents,
      debug: {
        totalQuotations: allQuotations?.length || 0,
        totalBookings: allBookings?.length || 0,
        filteredEvents: transformedEvents.length,
        sampleQuotation: allQuotations && allQuotations.length > 0 ? {
          id: allQuotations[0].id,
          pickup_date: allQuotations[0].pickup_date,
          created_at: allQuotations[0].created_at
        } : null
      }
    })
  } catch (error) {
    console.error('Error in date events API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
