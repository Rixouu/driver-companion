import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-client';

export const dynamic = "force-dynamic";

// GET: Fetch pricing categories for a vehicle
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient();
    const { id: vehicleId } = await params;

    // Fetch pricing categories linked to this vehicle
    const { data: pricingCategories, error } = await supabase
      .from('pricing_category_vehicles')
      .select(`
        category_id,
        pricing_categories (
          id,
          name,
          description,
          is_active,
          sort_order
        )
      `)
      .eq('vehicle_id', vehicleId);

    if (error) {
      console.error('Error fetching vehicle pricing categories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to a cleaner format
    const categories = pricingCategories?.map(pc => ({
      id: pc.pricing_categories.id,
      name: pc.pricing_categories.name,
      description: pc.pricing_categories.description,
      is_active: pc.pricing_categories.is_active,
      sort_order: pc.pricing_categories.sort_order
    })) || [];

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error handling GET request for vehicle pricing categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST: Update pricing categories for a vehicle
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient();
    const { id: vehicleId } = await params;
    const { categoryIds } = await req.json();

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json({ error: 'categoryIds must be an array' }, { status: 400 });
    }

    // First, remove all existing links for this vehicle
    const { error: deleteError } = await supabase
      .from('pricing_category_vehicles')
      .delete()
      .eq('vehicle_id', vehicleId);

    if (deleteError) {
      console.error('Error removing existing vehicle pricing categories:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // If no categories selected, we're done
    if (categoryIds.length === 0) {
      return NextResponse.json({ success: true, message: 'Vehicle pricing categories updated' });
    }

    // Add new links
    const newLinks = categoryIds.map(categoryId => ({
      vehicle_id: vehicleId,
      category_id: categoryId
    }));

    const { error: insertError } = await supabase
      .from('pricing_category_vehicles')
      .insert(newLinks);

    if (insertError) {
      console.error('Error adding new vehicle pricing categories:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Vehicle pricing categories updated successfully',
      updatedCategories: categoryIds.length
    });
  } catch (error) {
    console.error('Error handling POST request for vehicle pricing categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
