import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServer()
    const resolvedParams = await params
    const vehicleId = resolvedParams.id

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Fetch all available pricing categories
    const { data: categories, error: categoriesError } = await supabase
      .from('pricing_categories')
      .select('id, name, description, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (categoriesError) {
      console.error('Error fetching pricing categories:', categoriesError)
      return NextResponse.json(
        { error: 'Failed to fetch pricing categories' },
        { status: 500 }
      )
    }

    // Fetch current vehicle pricing categories
    const { data: vehicleCategories, error: vehicleCategoriesError } = await supabase
      .from('pricing_category_vehicles')
      .select('category_id')
      .eq('vehicle_id', vehicleId)

    if (vehicleCategoriesError) {
      console.error('Error fetching vehicle pricing categories:', vehicleCategoriesError)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle pricing categories' },
        { status: 500 }
      )
    }

    const currentCategoryIds = vehicleCategories?.map(vc => vc.category_id) || []

    // Return categories with selection status
    const categoriesWithSelection = categories?.map(category => ({
      ...category,
      isSelected: currentCategoryIds.includes(category.id)
    })) || []

    return NextResponse.json({
      categories: categoriesWithSelection,
      currentCategoryIds
    })
  } catch (error) {
    console.error('Error in vehicle pricing categories API:', error)
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
    const supabase = await createSupabaseServer()
    const resolvedParams = await params
    const vehicleId = resolvedParams.id

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { categoryIds } = body

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json(
        { error: 'Category IDs must be an array' },
        { status: 400 }
      )
    }

    // Remove all existing vehicle-category relationships
    const { error: deleteError } = await supabase
      .from('pricing_category_vehicles')
      .delete()
      .eq('vehicle_id', vehicleId)

    if (deleteError) {
      console.error('Error deleting existing vehicle pricing categories:', deleteError)
      return NextResponse.json(
        { error: 'Failed to update pricing categories' },
        { status: 500 }
      )
    }

    // Add new vehicle-category relationships
    if (categoryIds.length > 0) {
      const vehicleCategories = categoryIds.map(categoryId => ({
        vehicle_id: vehicleId,
        category_id: categoryId
      }))

      const { error: insertError } = await supabase
        .from('pricing_category_vehicles')
        .insert(vehicleCategories)

      if (insertError) {
        console.error('Error inserting vehicle pricing categories:', insertError)
        return NextResponse.json(
          { error: 'Failed to update pricing categories' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Vehicle pricing categories updated successfully' 
    })
  } catch (error) {
    console.error('Error updating vehicle pricing categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
