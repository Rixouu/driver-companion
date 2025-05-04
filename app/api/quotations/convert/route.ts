import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n/server';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { t } = await getDictionary();

  // Check auth
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch the quotation
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching quotation:', fetchError);
      return NextResponse.json(
        { error: t('notifications.error') },
        { status: 500 }
      );
    }
    
    // Check if the quotation is already converted
    if (quotation.status === 'converted') {
      return NextResponse.json(
        { error: t('notifications.alreadyConverted') },
        { status: 400 }
      );
    }
    
    // Check if the quotation is approved (only approved quotations can be converted)
    if (quotation.status !== 'approved') {
      return NextResponse.json(
        { error: t('notifications.notApproved') },
        { status: 400 }
      );
    }
    
    // Create a booking from the quotation details
    const bookingData = {
      customer_name: quotation.customer_name,
      customer_email: quotation.customer_email,
      customer_phone: quotation.customer_phone,
      pickup_date: quotation.pickup_date,
      pickup_time: quotation.pickup_time,
      pickup_location: quotation.pickup_location,
      dropoff_location: quotation.dropoff_location,
      vehicle_type: quotation.vehicle_type,
      service_type: quotation.service_type,
      passenger_count: quotation.passenger_count,
      duration_hours: quotation.duration_hours,
      status: 'confirmed',
      total_amount: quotation.total_amount,
      created_by: session.user.id,
      source: 'quotation',
      notes: quotation.customer_notes,
      internal_notes: `Converted from quotation ${quotation.quote_number || quotation.id}`
    };
    
    // Insert the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();
    
    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { error: t('notifications.error') },
        { status: 500 }
      );
    }
    
    // Update the quotation with the booking ID and status
    const { data: updatedQuotation, error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'converted',
        converted_to_booking_id: booking.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating quotation:', updateError);
      
      // If updating the quotation fails, we should delete the created booking
      // to avoid orphaned bookings
      await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id);
      
      return NextResponse.json(
        { error: t('notifications.error') },
        { status: 500 }
      );
    }
    
    // Create activity log
    await supabase
      .from('quotation_activities')
      .insert({
        quotation_id: id,
        user_id: session.user.id,
        action: 'converted',
        details: { 
          booking_id: booking.id,
          converted_at: new Date().toISOString()
        }
      });
    
    // In a real implementation, you would send a confirmation email
    // to the customer with booking details
    console.log(`Quotation ${id} converted to booking ${booking.id}`);
    
    return NextResponse.json({
      success: true,
      message: t('notifications.convertSuccess'),
      bookingId: booking.id,
      quotation: updatedQuotation
    });
  } catch (error) {
    console.error('Error converting quotation to booking:', error);
    return NextResponse.json(
      { error: t('notifications.error') },
      { status: 500 }
    );
  }
} 