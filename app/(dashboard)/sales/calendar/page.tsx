import { Metadata } from "next"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { SalesCalendar } from "@/components/sales/sales-calendar"

export const metadata: Metadata = {
  title: "Sales Calendar",
  description: "View all quotations and bookings in a unified calendar view",
}

export default async function SalesCalendarPage() {
  const supabase = await getSupabaseServerClient()

  // Fetch quotations
  const { data: quotations = [], error: quotationsError } = await supabase
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

  // Fetch bookings
  const { data: bookings = [], error: bookingsError } = await supabase
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
    // Don't fail the page if bookings table doesn't exist yet
  }

  return (
    <div className="container mx-auto">
      <SalesCalendar 
        quotations={quotations || []} 
        bookings={bookings || []} 
      />
    </div>
  )
}
