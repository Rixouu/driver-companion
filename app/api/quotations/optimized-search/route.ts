import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCache, setCache } from '@/lib/cache/redis-cache-optimized'

const CACHE_TTL = 60 // 1 minute for search results

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('payment_status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Create cache key based on search parameters
    const cacheKey = `quotation_search:${JSON.stringify({
      searchTerm,
      status,
      paymentStatus,
      startDate,
      endDate,
      limit,
      offset
    })}`

    // Check cache first
    const cached = await getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Call the optimized database function
    const { data, error } = await supabase.rpc('search_quotations', {
      search_term: searchTerm,
      status_filter: status,
      payment_status_filter: paymentStatus,
      start_date: startDate,
      end_date: endDate,
      limit_count: limit,
      offset_count: offset
    })

    if (error) {
      console.error('Error searching quotations:', error)
      return NextResponse.json(
        { error: 'Failed to search quotations' },
        { status: 500 }
      )
    }

    const result = {
      quotations: data || [],
      pagination: {
        limit,
        offset,
        total: data?.length || 0,
        hasMore: data?.length === limit
      }
    }

    // Cache the result
    await setCache(cacheKey, result, CACHE_TTL)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Quotation search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}