import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Fetch vehicle pricing data with proper joins
    const { data: pricingItems, error: pricingError } = await supabase
      .from('pricing_items')
      .select(`
        id,
        service_type,
        duration_hours,
        price,
        currency,
        is_active,
        created_at,
        updated_at,
        service_type_id,
        vehicle_id,
        pricing_categories!inner(
          id,
          name,
          description
        ),
        service_types!inner(
          id,
          name,
          description
        )
      `)
      .eq('vehicle_id', id)
      .eq('is_active', true)
      .order('duration_hours', { ascending: true })

    if (pricingError) {
      console.error('Error fetching vehicle pricing:', pricingError)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle pricing' },
        { status: 500 }
      )
    }

    // Group pricing items by service type for better organization
    const groupedItems = pricingItems?.reduce((acc, item) => {
      const serviceType = item.service_types?.name || item.service_type || 'Unknown Service'
      if (!acc[serviceType]) {
        acc[serviceType] = []
      }
      acc[serviceType].push({
        id: item.id,
        service_type: item.service_type,
        service_type_name: item.service_types?.name || item.service_type,
        duration_hours: item.duration_hours,
        price: item.price,
        currency: item.currency || 'JPY',
        is_active: item.is_active,
        category_name: item.pricing_categories?.name || 'Unknown',
        category_description: item.pricing_categories?.description
      })
      return acc
    }, {} as Record<string, any[]>) || {}

    return NextResponse.json({
      vehicle_id: id,
      grouped_items: groupedItems,
      total_items: pricingItems?.length || 0
    })

  } catch (error) {
    console.error('Error in vehicle pricing API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
