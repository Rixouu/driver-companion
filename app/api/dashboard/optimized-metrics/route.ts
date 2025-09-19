import { getSupabaseServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCache, setCache, invalidateCache } from '@/lib/cache/redis-cache-optimized'

const CACHE_KEY = 'dashboard_metrics'
const CACHE_TTL = 300 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Check cache first
    const cached = await getCache(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Call the optimized database function
    const { data, error } = await supabase.rpc('get_dashboard_metrics', {
      start_date: startDate,
      end_date: endDate
    })

    if (error) {
      console.error('Error fetching dashboard metrics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch dashboard metrics' },
        { status: 500 }
      )
    }

    const metrics = data?.[0] || {
      total_vehicles: 0,
      active_vehicles: 0,
      total_drivers: 0,
      active_drivers: 0,
      total_inspections: 0,
      pending_inspections: 0,
      in_progress_inspections: 0,
      completed_inspections: 0,
      total_quotations: 0,
      pending_quotations: 0,
      approved_quotations: 0,
      rejected_quotations: 0,
      total_bookings: 0,
      pending_bookings: 0,
      confirmed_bookings: 0,
      completed_bookings: 0,
      total_revenue: 0,
      monthly_revenue: 0,
      quarterly_revenue: 0,
      yearly_revenue: 0
    }

    // Cache the result
    await setCache(CACHE_KEY, metrics, CACHE_TTL)

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Dashboard metrics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Invalidate cache when data changes
    await invalidateCache(CACHE_KEY)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    )
  }
}