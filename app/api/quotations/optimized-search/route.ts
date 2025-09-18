import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Optimized Quotations Search API
 * Uses database function with full-text search for better performance
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    // Determine organization membership
    const ORGANIZATION_DOMAIN = 'japandriver.com'
    const userEmail = session.user?.email || ''
    const isOrganizationMember = userEmail.endsWith(`@${ORGANIZATION_DOMAIN}`)

    // Use optimized search function
    const { data: quotations, error } = await supabase
      .rpc('search_quotations', {
        search_term: search,
        status_filter: status,
        user_email: userEmail,
        is_organization_member: isOrganizationMember,
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

    // Extract total count from first result
    const totalCount = quotations?.[0]?.total_count || 0
    const quotationsData = quotations?.map(q => ({
      id: q.id,
      title: q.title,
      customer_name: q.customer_name,
      customer_email: q.customer_email,
      status: q.status,
      total_amount: q.total_amount,
      created_at: q.created_at,
      pickup_date: q.pickup_date,
      quotation_items: q.quotation_items
    })) || []

    return NextResponse.json({
      quotations: quotationsData,
      totalCount,
      hasMore: offset + limit < totalCount,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      search: {
        query: search,
        status,
        results: quotationsData.length
      },
      generated_at: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Quotations search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
