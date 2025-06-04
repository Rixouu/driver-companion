import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/errors/error-handler";
import { DatabaseError, ValidationError, AppError } from "@/lib/errors/app-error";

// Update the item type interface
interface QuotationItem {
  id: string;
  quotation_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  service_type_id?: string;
  service_type_name?: string;
  vehicle_type?: string;
  vehicle_category?: string;
  duration_hours?: number;
  service_days?: number;
  hours_per_day?: number;
  is_service_item?: boolean;
  [key: string]: any; // Allow for additional properties
}

export async function GET(req: NextRequest) {
  try {
    // Parse the quotation ID from the query parameters
    const url = new URL(req.url);
    const quotationId = url.searchParams.get('id');
    
    if (!quotationId) {
      throw new ValidationError('Missing quotation ID');
    }
    
    console.log('[QUOTATION DEBUG] Debug API route called for quotation:', quotationId);
    
    // Create the Supabase client using the helper that properly handles cookies
    const supabase = await getSupabaseServerClient();
    
    // First get the basic quotation info
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single();
    
    if (quotationError) {
      console.error('[QUOTATION DEBUG] Error fetching quotation:', quotationError);
      throw new DatabaseError('Failed to fetch quotation', { cause: quotationError as Error });
    }
    
    // Now get all items for this quotation
    const { data: items, error: itemsError } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('sort_order', { ascending: true });
    
    if (itemsError) {
      console.error('[QUOTATION DEBUG] Error fetching items:', itemsError);
      throw new DatabaseError('Failed to fetch items', { cause: itemsError as Error });
    }
    
    console.log(`[QUOTATION DEBUG] Successfully fetched ${items?.length || 0} items for quotation ${quotationId}`);
    
    // Later, use proper type assertion when filtering
    const typedItems = items as QuotationItem[] || [];
    const serviceItems = typedItems.filter(item => item.is_service_item === true);
    const regularItems = typedItems.filter(item => item.is_service_item !== true);
    
    console.log(`[QUOTATION DEBUG] Service items: ${serviceItems.length}, Regular items: ${regularItems.length}`);
    
    return NextResponse.json({
      success: true,
      quotation,
      items_count: items?.length || 0,
      service_items_count: serviceItems.length,
      regular_items_count: regularItems.length,
      items: items || []
    });
  } catch (error) {
    console.error('[QUOTATION DEBUG] Unexpected error in debug endpoint:', error);
    if (error instanceof AppError) {
      return handleApiError(error);
    }
    // Ensure 'error' is treated as Error or undefined for the cause
    const cause = error instanceof Error ? error : undefined;
    return handleApiError(new AppError('An unexpected error occurred in debug endpoint', 500, { cause, isOperational: true }));
  }
} 