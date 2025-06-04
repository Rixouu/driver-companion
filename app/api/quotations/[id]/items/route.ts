import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // No longer needed
// import { cookies } from 'next/headers'; // No longer needed for GET if using createSupabaseServerClient which handles cookies

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Create the Supabase client
    const supabase = await getSupabaseServerClient();
    
    // Ensure user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const quotationId = params.id;
    
    // First, verify the quotation exists and belongs to this user (using merchant_id)
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('id')
      .eq('id', quotationId)
      .single();
    
    if (quotationError || !quotation) {
      console.log('Quotation check failed:', quotationError);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Insert the item
    const newItem = {
      quotation_id: quotationId,
      description: body.description || 'Item',
      quantity: body.quantity || 1,
      unit_price: body.unit_price || 0,
      total_price: body.total_price || 0,
      sort_order: body.sort_order || 0,
      // Added fields for service-specific metadata
      service_type_id: body.service_type_id || null,
      service_type_name: body.service_type_name || null,
      vehicle_type: body.vehicle_type || null,
      vehicle_category: body.vehicle_category || null,
      duration_hours: body.duration_hours || null,
      service_days: body.service_days || null,
      hours_per_day: body.hours_per_day || null,
      is_service_item: body.is_service_item || false
    };
    
    const { data: insertedItem, error: insertError } = await supabase
      .from('quotation_items')
      .insert(newItem)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting item:', insertError);
      return NextResponse.json(
        { error: 'Failed to create item', details: insertError },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: insertedItem
    });
  } catch (error) {
    console.error('Unexpected error in item creation:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error },
      { status: 500 }
    );
  }
}

/**
 * GET handler for quotation items
 * Retrieves all items for a specific quotation
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const quotationId = params.id;
  console.log(`GET Request - Quotation Items for ID: ${quotationId}`);
  
  // const cookieStore = cookies(); // No longer needed
  const supabase = await getSupabaseServerClient();
  
  try {
    // Verify auth status
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to access this resource' },
        { status: 401 }
      );
    }
    
    // Fetch all items for the quotation
    console.log(`Fetching quotation items for ID: ${quotationId}`);
    const { data: items, error } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error(`Error fetching quotation items for ID ${quotationId}:`, error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }
    
    console.log(`Found ${items?.length || 0} items for quotation ID ${quotationId}`);
    
    // Log the first few items for debugging
    if (items && items.length > 0) {
      console.log(`First item sample:`, items[0]);
    }
    
    return NextResponse.json(items);
  } catch (error) {
    console.error(`Unexpected error fetching quotation items for ID ${quotationId}:`, error);
    return NextResponse.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 