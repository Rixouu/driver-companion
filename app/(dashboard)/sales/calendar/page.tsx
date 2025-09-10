import { Metadata } from "next"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { SalesCalendar } from "@/components/sales/sales-calendar"

export const metadata: Metadata = {
  title: "Sales Calendar",
  description: "View all quotations and bookings in a unified calendar view",
}

export default async function SalesCalendarPage() {
  const supabase = await getSupabaseServerClient()

  // Fetch quotations with user information
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
      created_at,
      created_by
    `)
    .order('pickup_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (quotationsError) {
    console.error('Error fetching quotations:', quotationsError)
  }

  // Fetch bookings with user information
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
      created_at,
      created_by
    `)
    .order('date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError)
    // Don't fail the page if bookings table doesn't exist yet
  }

  // Get unique user IDs from quotations and bookings
  const userIds = new Set<string>()
  quotations?.forEach(quotation => {
    if (quotation.created_by) userIds.add(quotation.created_by)
  })
  bookings?.forEach(booking => {
    if (booking.created_by) userIds.add(booking.created_by)
  })

  // Fetch user information from profiles table (same as quotation details page)
  const users = []
  for (const userId of userIds) {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', userId)
        .single()
      
      if (!profileError && profileData) {
        users.push({
          id: profileData.id,
          name: profileData.full_name || profileData.email?.split('@')[0] || `User ${userId.substring(0, 8)}`,
          email: profileData.email || `user-${userId.substring(0, 8)}@example.com`
        })
      } else {
        // Fallback for users we can't fetch from profiles
        users.push({
          id: userId,
          name: `User ${userId.substring(0, 8)}`,
          email: `user-${userId.substring(0, 8)}@example.com`
        })
      }
    } catch (error) {
      // Fallback for users we can't fetch
      users.push({
        id: userId,
        name: `User ${userId.substring(0, 8)}`,
        email: `user-${userId.substring(0, 8)}@example.com`
      })
    }
  }
  
  // Sort users by name
  users.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="container mx-auto">
      <SalesCalendar 
        quotations={quotations || []} 
        bookings={bookings || []}
        users={users || []}
      />
    </div>
  )
}
