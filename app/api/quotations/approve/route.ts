import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n/server';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
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
    await supabase
      .from('quotation_activities')
      .insert({
        quotation_id: id,
        user_id: session?.user?.id || null,
        customer_id: customerId || null,
        action: 'approved',
        details: { notes, approved_at: new Date().toISOString() }
      });
    
    // In a real implementation, you would send an email notification
    // to the merchant that the quotation was approved
    console.log(`Quotation ${id} approved by ${customerId || 'customer'}`);
    
    // Optional: auto-convert to booking here
    // In a real implementation, this might be a separate process or async job
    
    return NextResponse.json({
      success: true,
      message: t('notifications.approveSuccess'),
      quotation: updatedQuotation
    });
  } catch (error) {
    console.error('Error approving quotation:', error);
    return NextResponse.json(
      { error: t('notifications.error') },
      { status: 500 }
    );
  }
} 