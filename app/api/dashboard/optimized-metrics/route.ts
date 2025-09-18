import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Optimized Dashboard Metrics API
 * Uses database functions for better performance
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get optimized dashboard metrics using database function
    const { data: metrics, error } = await supabase
      .rpc('get_dashboard_metrics')

    if (error) {
      console.error('Error fetching dashboard metrics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch dashboard metrics' },
        { status: 500 }
      )
    }

    // Get vehicle utilization data
    const { data: vehicleUtilization, error: vehicleError } = await supabase
      .rpc('get_vehicle_utilization')

    if (vehicleError) {
      console.error('Error fetching vehicle utilization:', vehicleError)
    }

    // Get driver performance data
    const { data: driverPerformance, error: driverError } = await supabase
      .rpc('get_driver_performance')

    if (driverError) {
      console.error('Error fetching driver performance:', driverError)
    }

    // Get quotations analytics for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: quotationsAnalytics, error: quotationsError } = await supabase
      .rpc('get_quotations_analytics', {
        from_date: thirtyDaysAgo.toISOString(),
        to_date: new Date().toISOString()
      })

    if (quotationsError) {
      console.error('Error fetching quotations analytics:', quotationsError)
    }

    // Get bookings analytics for the last 30 days
    const { data: bookingsAnalytics, error: bookingsError } = await supabase
      .rpc('get_bookings_analytics', {
        from_date: thirtyDaysAgo.toISOString(),
        to_date: new Date().toISOString()
      })

    if (bookingsError) {
      console.error('Error fetching bookings analytics:', bookingsError)
    }

    // Combine all metrics
    const result = {
      // Basic metrics from database function
      ...metrics?.[0],
      
      // Additional analytics
      quotations: quotationsAnalytics?.[0] || {
        total_revenue: 0,
        total_quotations: 0,
        avg_quote_value: 0,
        approval_rate: 0,
        conversion_rate: 0,
        status_counts: {},
        daily_revenue: {}
      },
      
      bookings: bookingsAnalytics?.[0] || {
        total_bookings: 0,
        active_bookings: 0,
        completed_bookings: 0,
        cancelled_bookings: 0,
        total_revenue: 0,
        avg_booking_value: 0,
        daily_bookings: {}
      },
      
      // Vehicle and driver data
      vehicleUtilization: vehicleUtilization || [],
      driverPerformance: driverPerformance || [],
      
      // Metadata
      generated_at: new Date().toISOString(),
      cache_duration: 300 // 5 minutes
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Dashboard metrics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
