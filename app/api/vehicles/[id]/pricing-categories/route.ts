import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-client"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = createServiceClient()

    // Get pricing category for this vehicle through junction table (same as booking system)
    const { data: vehicleCategories, error: vehicleError } = await supabase
      .from('pricing_category_vehicles')
      .select(`
        category_id,
        pricing_categories!inner(
          id,
          name,
          description
        )
      `)
      .eq('vehicle_id', id)

    if (vehicleError) {
      console.error('[API] Error fetching vehicle categories:', vehicleError)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle categories' },
        { status: 500 }
      )
    }

    if (!vehicleCategories || vehicleCategories.length === 0) {
      return NextResponse.json({ categories: [] })
    }

    // Extract categories from junction table data
    const categories = vehicleCategories.map(vc => vc.pricing_categories)

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('[API] Error in vehicle pricing categories endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient()
    const resolvedParams = await params
    const vehicleId = resolvedParams.id

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { categoryId } = body

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Update the vehicle's category using junction table
    // First, remove existing category associations
    const { error: deleteError } = await supabase
      .from('pricing_category_vehicles')
      .delete()
      .eq('vehicle_id', vehicleId)

    if (deleteError) {
      console.error('Error removing existing vehicle categories:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove existing categories' },
        { status: 500 }
      )
    }

    // Then add the new category association
    const { error: insertError } = await supabase
      .from('pricing_category_vehicles')
      .insert({
        vehicle_id: vehicleId,
        category_id: categoryId
      })

    if (insertError) {
      console.error('Error adding vehicle pricing category:', insertError)
      return NextResponse.json(
        { error: 'Failed to add pricing category' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Vehicle pricing category updated successfully' 
    })
  } catch (error) {
    console.error('Error updating vehicle pricing category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
