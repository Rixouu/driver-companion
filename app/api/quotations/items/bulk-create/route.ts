import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // Create the Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Ensure user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the request body with quotation_id and items
    const body = await request.json();
    const { quotation_id, items } = body;
    
    if (!quotation_id || !items || !Array.isArray(items) || items.length === 0) {
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
      is_service_item: item.is_service_item || false
    }));
    
    // Insert items in bulk
    const { data: insertedItems, error: insertError } = await supabase
      .from('quotation_items')
      .insert(formattedItems)
      .select();
    
    if (insertError) {
      console.error('Error inserting line items:', insertError);
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