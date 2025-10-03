import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/errors/error-handler'
import { DatabaseError, AuthenticationError } from '@/lib/errors/app-error'

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    // Check auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new AuthenticationError('User not authenticated')
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    // Start building the query
    let query = supabase
      .from('bookings')
      .select(`
        id,
        wp_id,
        customer_name,
        customer_email,
        service_name,
        vehicle_make,
        vehicle_model,
        vehicle_capacity,
        pickup_location,
        dropoff_location,
        date,
        time,
        duration,
        price_amount,
        price_currency,
        payment_status,
        status,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply search filter if provided
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,service_name.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: bookings, error, count } = await query

    if (error) {
      throw new DatabaseError('Error fetching bookings from database.', { cause: error })
    }

    return NextResponse.json({
      data: bookings || [],
      count: count || 0,
      limit,
      offset
    })

  } catch (error) {
    return handleApiError(error)
  }
}
