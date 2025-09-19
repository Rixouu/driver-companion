import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCache, setCache } from '@/lib/cache/redis-cache-optimized'

const CACHE_TTL = 300 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const groupBy = searchParams.get('group_by') || 'month'

    // Create cache key
    const cacheKey = `revenue_analytics:${JSON.stringify({
      startDate,
      endDate,
      groupBy
    })}`

    // Check cache first
    const cached = await getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Call the optimized database function
    const { data, error } = await supabase.rpc('get_revenue_analytics', {
      start_date: startDate,
      end_date: endDate,
      group_by: groupBy
    })

    if (error) {
      console.error('Error fetching revenue analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch revenue analytics' },
        { status: 500 }
      )
    }

    // Cache the result
    await setCache(cacheKey, data, CACHE_TTL)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Revenue analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
