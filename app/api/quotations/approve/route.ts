import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { t } = await getDictionary();

  try {
    const { id, notes, customerId } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }
    
    // Get current session - this may be null for public access
    const { data: { session } } = await supabase.auth.getSession();
    
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
    
    // Check if the quotation is already approved or converted
    if (quotation.status === 'approved' || quotation.status === 'converted') {
      return NextResponse.json(
        { error: t('notifications.alreadyApproved') },
        { status: 400 }
      );
    }
    
    // Check if the quotation is expired
    if (quotation.status === 'expired' || new Date(quotation.expiry_date) < new Date()) {
      return NextResponse.json(
        { error: t('notifications.expired') },
        { status: 400 }
      );
    }
    
    // Update quotation status to 'approved' and add notes if provided
    const updateData: any = { 
      status: 'approved',
      updated_at: new Date().toISOString()
    };
    
    if (notes) {
      updateData.customer_notes = notes;
    }
    
    // Update the quotation
    const { data: updatedQuotation, error: updateError } = await supabase
      .from('quotations')
      .update(updateData)
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
    
    // Create activity log
    // If session exists, use user_id, otherwise use a placeholder or customer_id
    const userId = session?.user?.id || customerId || '00000000-0000-0000-0000-000000000000';
    await supabase
      .from('quotation_activities')
      .insert({
        quotation_id: id,
        user_id: userId,
        action: 'approved',
        details: { 
          status: 'approved',
          notes: notes || null
        }
      });
    
    return NextResponse.json(updatedQuotation);
  } catch (error) {
    console.error('Error approving quotation:', error);
    return NextResponse.json(
      { error: t('notifications.error') },
      { status: 500 }
    );
  }
} 