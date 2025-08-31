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

    // Fetch vehicle pricing data from pricing_items table
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
        vehicle_id
      `)
      .eq('vehicle_id', id)
      .eq('is_active', true)
      .order('service_type')

    if (pricingError) {
      console.error('Error fetching vehicle pricing:', pricingError)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle pricing' },
        { status: 500 }
      )
    }

    // Fetch pricing categories for additional context
    const { data: categories, error: categoriesError } = await supabase
      .from('pricing_categories')
      .select(`
        id,
        name,
        description,
        service_types,
        is_active
      `)
      .eq('is_active', true)

    if (categoriesError) {
      console.error('Error fetching pricing categories:', categoriesError)
      // Continue without categories if there's an error
    }

    // Fetch service types for additional context
    const { data: serviceTypes, error: serviceTypesError } = await supabase
      .from('pricing_category_service_types')
      .select(`
        id,
        name,
        description,
        category_id
      `)
      .eq('is_active', true)

    if (serviceTypesError) {
      console.error('Error fetching service types:', serviceTypesError)
      // Continue without service types if there's an error
    }

    // Enrich pricing items with category and service type information
    const enrichedItems = pricingItems?.map(item => {
      const category = categories?.find(cat => 
        cat.service_types?.includes(item.service_type_id) || 
        cat.service_type_ids?.includes(item.service_type_id)
      )
      
      const serviceType = serviceTypes?.find(st => st.id === item.service_type_id)
      
      return {
        ...item,
        category_name: category?.name || null,
        category_description: category?.description || null,
        service_type_name: serviceType?.name || item.service_type,
        service_type_description: serviceType?.description || null
      }
    }) || []

    return NextResponse.json({
      vehicle_id: id,
      items: enrichedItems,
      categories: categories || [],
      service_types: serviceTypes || [],
      total_items: enrichedItems.length,
      total_categories: categories?.length || 0
    })

  } catch (error) {
    console.error('Error in vehicle pricing API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
