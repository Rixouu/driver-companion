import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    console.log('TEST BULK CREATE - Starting test...');
    
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
    
    // Get a recent quotation ID to test with
    const { data: quotations, error: quotationError } = await supabase
      .from('quotations')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (quotationError || !quotations || quotations.length === 0) {
      return NextResponse.json(
        { error: 'No quotations found to test with' },
        { status: 404 }
      );
    }
    
    const quotation_id = quotations[0].id;
    console.log('TEST BULK CREATE - Using quotation ID:', quotation_id);
    
    // Create test items
    const testItems = [
      {
        description: "Test Service - Airport Transfer",
        service_type_id: "a2538c63-bad1-4523-a234-a708b03744b4",
        service_type_name: "Airport Transfer Haneda",
        vehicle_type: "Mercedes Benz V Class - Black Suite",
        vehicle_category: "platinum",
        duration_hours: 1,
        service_days: 1,
        hours_per_day: 1,
        unit_price: 46000,
        total_price: 46000,
        quantity: 1,
        sort_order: 0,
        is_service_item: true,
        pickup_date: "2025-06-11",
        pickup_time: "10:00"
      }
    ];
    
    console.log('TEST BULK CREATE - Test items:', JSON.stringify(testItems, null, 2));
    
    // Format items for insertion (same logic as the real endpoint)
    const formattedItems = testItems.map((item: any, index: number) => ({
      quotation_id,
      description: item.description || 'Item',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      total_price: item.total_price || 0,
      sort_order: item.sort_order || index,
      service_type_id: item.service_type_id || null,
      service_type_name: item.service_type_name || null,
      vehicle_type: item.vehicle_type || null,
      vehicle_category: item.vehicle_category || null,
      duration_hours: item.duration_hours || null,
      service_days: item.service_days || null,
      hours_per_day: item.hours_per_day || null,
      is_service_item: item.is_service_item || false,
      pickup_date: item.pickup_date || null,
      pickup_time: item.pickup_time || null,
      time_based_adjustment: item.time_based_adjustment || null,
      time_based_rule_name: item.time_based_rule_name || null
    }));
    
    console.log('TEST BULK CREATE - Formatted items:', JSON.stringify(formattedItems, null, 2));
    
    // Try to insert
    const { data: insertedItems, error: insertError } = await supabase
      .from('quotation_items')
      .insert(formattedItems)
      .select();
    
    if (insertError) {
      console.error('TEST BULK CREATE - Database error:', insertError);
      return NextResponse.json(
        { 
          error: 'Database insert failed', 
          details: insertError,
          formattedItems: formattedItems
        },
        { status: 500 }
      );
    }
    
    console.log('TEST BULK CREATE - Success! Inserted items:', insertedItems);
    
    return NextResponse.json({
      success: true,
      message: `Test successful - inserted ${insertedItems?.length || 0} items`,
      data: insertedItems
    });
  } catch (error) {
    console.error('TEST BULK CREATE - Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: error },
      { status: 500 }
    );
  }
} 