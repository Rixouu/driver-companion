import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export const dynamic = 'force-dynamic'

/**
 * GET handler for directly debugging booking data with SQL
 * This endpoint provides raw SQL query results for troubleshooting
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the booking ID from the URL
    const id = params.id
    
    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }
    
    // Create Supabase client
    const supabase = createServiceClient()
    
    // Run direct SQL query to check all fields
    const { data: sqlData, error: sqlError } = await supabase.rpc(
      'debug_booking',
      { booking_id_param: id }
    )
    
    // If the RPC doesn't exist, we'll fall back to a direct query
    if (sqlError && sqlError.message.includes('does not exist')) {
      console.log('DEBUG RPC not found, falling back to direct SQL')
      
      // Run direct SQL query to check the raw data
      const { data: directData, error: directError } = await supabase
        .from('bookings')
        .select('*')
        .or(`id.eq.${id},wp_id.eq.${id}`)
        .limit(1)
      
      if (directError) {
        return NextResponse.json(
          { error: directError.message },
          { status: 500 }
        )
      }
      
      if (!directData || directData.length === 0) {
        return NextResponse.json(
          { error: 'Booking not found', id },
          { status: 404 }
        )
      }
      
      // Check table schema to see fields available
      const { data: columnsData, error: columnsError } = await supabase
        .from('bookings')
        .select('*')
        .limit(0)
      
      // Return the data for debugging
      return NextResponse.json({
        booking_data: directData[0],
        booking_record_count: directData.length,
        columns_available: columnsData ? Object.keys(columnsData[0] || {}) : [],
        id_check: {
          queried_id: id,
          internal_id: directData[0]?.id,
          wp_id: directData[0]?.wp_id
        },
        fields_of_interest: {
          // Coupon fields
          coupon_code: directData[0]?.coupon_code,
          coupon_discount_percentage: directData[0]?.coupon_discount_percentage,
          
          // Billing fields
          billing_company_name: directData[0]?.billing_company_name,
          billing_tax_number: directData[0]?.billing_tax_number,
          billing_street_name: directData[0]?.billing_street_name,
          billing_street_number: directData[0]?.billing_street_number,
          billing_city: directData[0]?.billing_city,
          billing_state: directData[0]?.billing_state,
          billing_postal_code: directData[0]?.billing_postal_code,
          billing_country: directData[0]?.billing_country
        }
      })
    }
    
    // Return the RPC data
    return NextResponse.json({
      rpc_result: sqlData
    })
  } catch (error) {
    console.error('Error in booking SQL debug API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 