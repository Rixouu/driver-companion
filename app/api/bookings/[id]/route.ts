import { NextResponse } from 'next/server'
import { getBookingById } from '@/app/actions/bookings'
import { handleApiError } from '@/lib/errors/error-handler';
import { AppError, DatabaseError, NotFoundError, ValidationError } from '@/lib/errors/app-error';

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    console.log(`[API] Fetching booking with ID: ${id}`)
    
    if (!id) {
      throw new ValidationError('Booking ID is required');
    }
    
    const { booking } = await getBookingById(id)
    
    console.log(`[API] Booking data for ID ${id}:`, booking ? 'FOUND' : 'NOT FOUND')
    
    if (booking) {
      console.log(`[API] Billing fields for ${id}:`, {
        billing_company_name: booking.billing_company_name,
        billing_tax_number: booking.billing_tax_number,
        billing_street_name: booking.billing_street_name,
        billing_street_number: booking.billing_street_number,
        billing_city: booking.billing_city,
        billing_state: booking.billing_state,
        billing_postal_code: booking.billing_postal_code,
        billing_country: booking.billing_country
      })
      
      console.log(`[API] Coupon fields for ${id}:`, {
        coupon_code: booking.coupon_code,
        coupon_discount_percentage: booking.coupon_discount_percentage  
      })
    }
    
    // Error handling is now done within getBookingById function

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    return NextResponse.json(booking, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    // console.error('[API] Error in booking API route:', error) // Replaced by handleApiError
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    console.log(`[API] Deleting booking with ID: ${id}`)
    
    if (!id) {
      throw new ValidationError('Booking ID is required');
    }
    
    // Validate ID format (should be a valid UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error(`[API] Invalid booking ID format: ${id}`);
      throw new ValidationError(`Invalid booking ID format: ${id}. Expected UUID format.`);
    }
    
    // Create service client for admin-level database operations
    let supabase;
    try {
      const { createServiceClient } = await import('@/lib/supabase/service-client');
      supabase = createServiceClient();
      console.log(`[API] Service client created successfully for booking ${id}`);
      
      // Test the connection
      const { data: testData, error: testError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true });
      
      if (testError) {
        console.error(`[API] Service client test failed:`, testError);
        throw new Error(`Service client connection test failed: ${testError.message}`);
      }
      
      console.log(`[API] Service client connection test successful, found ${testData?.length || 0} bookings`);
      
    } catch (importError) {
      console.error(`[API] Error importing service client:`, importError);
      throw new Error(`Failed to create service client: ${importError instanceof Error ? importError.message : 'Unknown error'}`);
    }
    
    // First check if the booking exists
    console.log(`[API] Checking if booking ${id} exists...`);
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, wp_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error(`[API] Error fetching booking ${id}:`, fetchError);
      throw new DatabaseError(`Failed to fetch booking: ${fetchError.message}`);
    }
    
    if (!existingBooking) {
      console.log(`[API] Booking ${id} not found in database`);
      throw new NotFoundError('Booking not found');
    }
    
    console.log(`[API] Found booking ${id}, proceeding with deletion...`);
    
    // Delete the booking
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error(`[API] Error deleting booking ${id}:`, deleteError);
      throw new DatabaseError(`Failed to delete booking: ${deleteError.message}`);
    }
    
    console.log(`[API] Successfully deleted booking ${id}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Booking ${id} deleted successfully` 
    });
    
  } catch (error) {
    console.error(`[API] Error deleting booking:`, error);
    return handleApiError(error);
  }
} 