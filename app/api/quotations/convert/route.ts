import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-client';

export async function POST(request: NextRequest) {
  try {
    const { quotation_id } = await request.json();
    
    console.log('Converting quotation to booking:', quotation_id);
    
    if (!quotation_id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    console.log('Supabase service client created successfully');

    // Get the quotation details
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (*),
        customers (*)
      `)
      .eq('id', quotation_id)
      .single();

    if (quotationError || !quotation) {
      console.error('Error fetching quotation:', quotationError);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    console.log('Quotation found:', {
      id: quotation.id,
      status: quotation.status,
      customer_name: quotation.customer_name,
      items_count: quotation.quotation_items?.length || 0
    });

    // Check if quotation is approved or paid
    if (!['approved', 'paid'].includes(quotation.status)) {
      return NextResponse.json(
        { error: 'Only approved or paid quotations can be converted to bookings' },
        { status: 400 }
      );
    }

    // Check if booking already exists by looking for quotation_id in meta field
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('id, meta')
      .not('meta', 'is', null);

    // Check if any existing booking has this quotation_id in meta
    const existingBooking = existingBookings?.find(booking => 
      booking.meta && typeof booking.meta === 'object' && 
      'quotation_id' in booking.meta && 
      (booking.meta as any).quotation_id === quotation_id
    );

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Booking already exists for this quotation' },
        { status: 400 }
      );
    }

    // Create the booking with service information stored in meta
    console.log('Creating booking with data:', {
      customer_name: quotation.customer_name,
      customer_email: quotation.customer_email,
      service_name: quotation.title || 'Service from Quotation',
      date: quotation.pickup_date || new Date().toISOString().split('T')[0],
      price_amount: quotation.amount || 0
    });

    // Calculate the final amount including discounts and taxes
    // Use total_amount if available, otherwise calculate from base amount
    const baseAmount = quotation.total_amount || quotation.amount || 0;
    const discountPercentage = quotation.discount_percentage || 0;
    const taxPercentage = quotation.tax_percentage || 0;
    const promotionDiscount = quotation.promotion_discount || 0;
    
    // If total_amount is available, use it directly (it already includes all calculations)
    // Otherwise, calculate from base amount
    let finalAmount = baseAmount;
    let discountAmount = 0;
    let taxAmount = 0;
    
    if (!quotation.total_amount) {
      // Calculate manually only if total_amount is not available
      discountAmount = baseAmount * (discountPercentage / 100);
      const subtotal = baseAmount - discountAmount - promotionDiscount;
      taxAmount = subtotal * (taxPercentage / 100);
      finalAmount = subtotal + taxAmount;
    }

    // Get pickup and dropoff locations from quotation
    const pickupLocation = quotation.pickup_location || 'Location to be confirmed';
    const dropoffLocation = quotation.dropoff_location || 'Location to be confirmed';

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        wp_id: `QUO-${quotation.quote_number || Math.floor(Math.random() * 1000000)}`,
        customer_name: quotation.customer_name,
        customer_email: quotation.customer_email,
        customer_phone: quotation.customer_phone,
        service_name: quotation.title || 'Service from Quotation',
        service_id: quotation.service_type_id,
        date: quotation.pickup_date || new Date().toISOString().split('T')[0],
        time: quotation.pickup_time || '09:00:00',
        status: 'confirmed',
        price_amount: finalAmount,
        price_currency: quotation.currency || 'JPY',
        payment_status: 'Payment Complete',
        payment_method: 'Omise',
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        distance: '0', // Default distance as string
        duration: `${quotation.duration_hours || 1}h`,
        notes: `Converted from quotation #${quotation.quote_number || quotation.id}`,
        billing_company_name: quotation.billing_company_name,
        billing_tax_number: quotation.billing_tax_number,
        billing_street_name: quotation.billing_street_name,
        billing_street_number: quotation.billing_street_number,
        billing_city: quotation.billing_city,
        billing_state: quotation.billing_state,
        billing_postal_code: quotation.billing_postal_code,
        billing_country: quotation.billing_country,
        meta: {
          quotation_id: quotation_id,
          original_amount: baseAmount,
          discount_percentage: discountPercentage,
          discount_amount: discountAmount,
          promotion_discount: promotionDiscount,
          tax_percentage: taxPercentage,
          tax_amount: taxAmount,
          final_amount: finalAmount,
          quotation_items: quotation.quotation_items,
          conversion_date: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    console.log('Booking created successfully:', booking.id);

    // Update quotation status to 'converted'
    const { error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'converted',
        updated_at: new Date().toISOString()
      })
      .eq('id', quotation_id);

    if (updateError) {
      console.error('Error updating quotation status:', updateError);
      // Continue anyway as the booking was created
    }

    // Create activity record
    try {
      const { error: activityError } = await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: quotation_id,
          action: 'converted_to_booking',
          details: { 
            booking_id: booking.id,
            action_type: 'conversion',
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      if (activityError) {
        console.error('Error creating activity record:', activityError);
        // Continue anyway as the main conversion was successful
      } else {
        console.log('Activity record created successfully');
      }
    } catch (activityError) {
      console.error('Error creating activity record:', activityError);
      // Continue anyway as the main conversion was successful
    }

    console.log('Quotation conversion completed successfully');
    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      message: 'Quotation successfully converted to booking'
    });

  } catch (error) {
    console.error('Error converting quotation to booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 