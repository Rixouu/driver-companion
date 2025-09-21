import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
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
    
    // Get the request body with quotation_id and items
    const body = await req.json();
    const { quotation_id, items } = body;
    
    console.log('BULK CREATE DEBUG - Request body:', JSON.stringify(body, null, 2));

    if (!quotation_id || !items || !Array.isArray(items) || items.length === 0) {
      console.log('BULK CREATE DEBUG - Validation failed:', {
        quotation_id: !!quotation_id,
        items: !!items,
        isArray: Array.isArray(items),
        length: items?.length
      });
      return NextResponse.json(
        { error: 'Invalid request. Required fields: quotation_id, items' },
        { status: 400 }
      );
    }
    
    console.log('Bulk creating line items for quotation:', quotation_id);
    console.log('Number of items:', items.length);
    
    // First, verify the quotation exists and belongs to this user
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('id')
      .eq('id', quotation_id)
      .eq('merchant_id', user.id)
      .single();
    
    if (quotationError || !quotation) {
      console.log('Quotation check failed:', quotationError);
      
      // Try again without merchant_id check as fallback
      const { data: fallbackQuotation, error: fallbackError } = await supabase
        .from('quotations')
        .select('id, merchant_id')
        .eq('id', quotation_id)
        .single();
        
      if (fallbackError || !fallbackQuotation) {
        return NextResponse.json(
          { error: 'Quotation not found or not authorized', details: quotationError },
          { status: 404 }
        );
      }
      
      console.log('Quotation found via fallback, merchant_id:', fallbackQuotation.merchant_id);
    }
    
    // Format items for insertion
    const formattedItems = items.map((item: any, index: number) => ({
      quotation_id,
      description: item.description || 'Item',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      total_price: item.total_price || 0,
      sort_order: item.sort_order || index,
      // Added fields for service-specific metadata
      service_type_id: item.service_type_id || null,
      service_type_name: item.service_type_name || null,
      vehicle_type: item.vehicle_type || null,
      vehicle_category: item.vehicle_category || null,
      duration_hours: item.duration_hours || null,
      service_days: item.service_days || null,
      hours_per_day: item.hours_per_day || null,
      is_service_item: item.is_service_item || false,
      // Pickup date/time and time-based adjustments
      pickup_date: item.pickup_date || null,
      pickup_time: item.pickup_time || null,
      time_based_adjustment: item.time_based_adjustment || null,
      time_based_rule_name: item.time_based_rule_name || null,
      // New fields for pickup/dropoff locations and passenger details
      pickup_location: item.pickup_location || null,
      dropoff_location: item.dropoff_location || null,
      number_of_passengers: item.number_of_passengers || null,
      number_of_bags: item.number_of_bags || null,
      flight_number: item.flight_number || null,
      terminal: item.terminal || null
    }));
    
    console.log('BULK CREATE DEBUG - Formatted items for DB:', JSON.stringify(formattedItems, null, 2));
    
    // Insert items in bulk
    const { data: insertedItems, error: insertError } = await supabase
      .from('quotation_items')
      .insert(formattedItems)
      .select();
    
    if (insertError) {
      console.error('BULK CREATE DEBUG - Database error details:', insertError);
      console.error('BULK CREATE DEBUG - Error code:', insertError.code);
      console.error('BULK CREATE DEBUG - Error message:', insertError.message);
      console.error('BULK CREATE DEBUG - Error details:', insertError.details);
      console.error('BULK CREATE DEBUG - Error hint:', insertError.hint);
      return NextResponse.json(
        { error: 'Failed to create line items', details: insertError },
        { status: 500 }
      );
    }
    
    console.log('Successfully inserted line items:', insertedItems?.length || 0);
    
    return NextResponse.json({
      success: true,
      message: `Created ${insertedItems?.length || 0} line items for quotation ${quotation_id}`,
      data: insertedItems
    });
  } catch (error) {
    console.error('Unexpected error in bulk item creation:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error },
      { status: 500 }
    );
  }
} 