import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n/server';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { t } = await getDictionary();

  try {
    const { id, reason, customerId } = await request.json();
    
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
    
    // Check if the quotation can be rejected
    if (['approved', 'rejected', 'converted'].includes(quotation.status)) {
      return NextResponse.json(
        { error: t('notifications.cannotReject') },
        { status: 400 }
      );
    }
    
    // Update quotation status to 'rejected' and add rejection reason
    const { data: updatedQuotation, error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'rejected',
        rejected_reason: reason || null,
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
    
    // Create activity log
    await supabase
      .from('quotation_activities')
      .insert({
        quotation_id: id,
        user_id: session?.user?.id || null,
        customer_id: customerId || null,
        action: 'rejected',
        details: { reason, rejected_at: new Date().toISOString() }
      });
    
    // In a real implementation, you would send an email notification
    // to the merchant that the quotation was rejected
    console.log(`Quotation ${id} rejected by ${customerId || 'customer'}`);
    
    return NextResponse.json({
      success: true,
      message: t('notifications.rejectSuccess'),
      quotation: updatedQuotation
    });
  } catch (error) {
    console.error('Error rejecting quotation:', error);
    return NextResponse.json(
      { error: t('notifications.error') },
      { status: 500 }
    );
  }
} 