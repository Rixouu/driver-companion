import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCache, setCache } from '@/lib/cache/redis-cache-optimized'

const CACHE_TTL = 300 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicle_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Create cache key
    const cacheKey = `vehicle_analytics:${JSON.stringify({
      vehicleId,
      startDate,
      endDate
    })}`

    // Check cache first
    const cached = await getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Call the optimized database function
    const { data, error } = await supabase.rpc('get_vehicle_analytics', {
      vehicle_id: vehicleId,
      start_date: startDate,
      end_date: endDate
    })

    if (error) {
      console.error('Error fetching vehicle analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle analytics' },
        { status: 500 }
      )
    }

    // Cache the result
    await setCache(cacheKey, data, CACHE_TTL)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Vehicle analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
