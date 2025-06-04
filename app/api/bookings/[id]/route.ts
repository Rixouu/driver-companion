import { NextResponse } from 'next/server'
import { getBookingByIdFromDatabase } from '@/lib/api/bookings-service'
import { handleApiError } from '@/lib/errors/error-handler';
import { AppError, DatabaseError, NotFoundError, ValidationError } from '@/lib/errors/app-error';

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    console.log(`[API] Fetching booking with ID: ${id}`)
    
    if (!id) {
      throw new ValidationError('Booking ID is required');
    }
    
    const { booking, error: dbError } = await getBookingByIdFromDatabase(id)
    
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
    
    if (dbError) {
      // Create a new Error object to pass as cause, using the message from dbError.
      const errorMessage = ((dbError as any)?.message && typeof (dbError as any).message === 'string')
                           ? (dbError as any).message
                           : 'Unknown database error details.';
      const cause = new Error(errorMessage);
      throw new DatabaseError('Failed to fetch booking from database.', { cause });
    }

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