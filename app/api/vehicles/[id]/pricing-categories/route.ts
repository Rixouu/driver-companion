import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-client"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = createServiceClient()

    // Get pricing category for this vehicle through direct relationship
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select(`
        vehicle_category_id,
        pricing_categories (
          id,
          name,
          description
        )
      `)
      .eq('id', id)
      .single()

    if (vehicleError) {
      console.error('[API] Error fetching vehicle:', vehicleError)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle' },
        { status: 500 }
      )
    }

    if (!vehicle || !vehicle.vehicle_category_id) {
      return NextResponse.json({ categories: [] })
    }

    // Get the pricing category details
    const { data: pricingCategory, error: categoryError } = await supabase
      .from('pricing_categories')
      .select('id, name, description')
      .eq('id', vehicle.vehicle_category_id)
      .single()

    if (categoryError) {
      console.error('[API] Error fetching pricing category:', categoryError)
      return NextResponse.json(
        { error: 'Failed to fetch pricing category' },
        { status: 500 }
      )
    }

    const categories = pricingCategory ? [pricingCategory] : []

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

    // Update the vehicle's category
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({ vehicle_category_id: categoryId })
      .eq('id', vehicleId)

    if (updateError) {
      console.error('Error updating vehicle pricing category:', updateError)
      return NextResponse.json(
        { error: 'Failed to update pricing category' },
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
