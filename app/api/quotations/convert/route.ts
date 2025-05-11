import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
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
        { error: t('quotations.notifications.error') },
        { status: 500 }
      );
    }
    
    // Check if the quotation is already converted
    if (quotation.status === 'converted') {
      return NextResponse.json(
        { error: t('quotations.notifications.alreadyConverted') },
        { status: 400 }
      );
    }
    
    // Check if the quotation is approved (only approved quotations can be converted)
    if (quotation.status !== 'approved') {
      return NextResponse.json(
        { error: t('quotations.notifications.notApproved') },
        { status: 400 }
      );
    }
    
    // Update quotation status to 'converted'
    const { data: updatedQuotation, error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'converted',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating quotation status:', updateError);
      return NextResponse.json(
        { error: t('notifications.error') },
        { status: 500 }
      );
    }
    
    // Cast quotation to any to avoid TypeScript errors with unknown properties
    const q = quotation as any;
    
    // Create a simplified booking record with only required fields
    const bookingData = {
      date: q.pickup_date || new Date().toISOString().split('T')[0],
      time: q.pickup_time || '12:00',
      service_name: q.service_type,
      customer_name: q.customer_name,
      customer_email: q.customer_email,
      customer_phone: q.customer_phone,
      vehicle_type: q.vehicle_type,
      status: 'confirmed',
      notes: q.notes || '',
      amount: q.amount,
      currency: q.currency || 'JPY',
      wp_id: '',  // Empty string instead of null
      created_by: session.user.id,
      source: 'quotation'
    };
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();
    
    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      
      // Revert quotation status if booking creation fails
      await supabase
        .from('quotations')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
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
        details: { booking_id: booking.id }
      });
    
    return NextResponse.json({
      quotation: updatedQuotation,
      booking
    });
  } catch (error) {
    console.error('Error converting quotation:', error);
    return NextResponse.json(
      { error: t('notifications.error') },
      { status: 500 }
    );
  }
} 