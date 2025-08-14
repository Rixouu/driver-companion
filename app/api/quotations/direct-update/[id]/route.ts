import { NextResponse } from 'next/server';
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  const quotationId = params.id;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { amount, total_amount } = body;

  if (!quotationId) {
    return NextResponse.json({ error: 'Quotation ID is required' }, { status: 400 });
  }
  if (amount === undefined || total_amount === undefined) {
    return NextResponse.json({ error: 'Both amount and total_amount are required' }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();

  const { user, error: userError } = await getCurrentUser();

  if (userError || !user) {
    console.error('[API direct-update] Authentication error:', userError?.message);
    return NextResponse.json({ error: 'Unauthorized - User not authenticated' }, { status: 401 });
  }

  try {
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('merchant_id')
      .eq('id', quotationId)
      .single();

    if (quotationError) {
      console.error(`[API direct-update] Error fetching quotation ${quotationId} for auth check:`, quotationError.message);
      if (quotationError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to verify quotation ownership', details: quotationError.message }, { status: 500 });
    }

    if (!quotation) {
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    
    if (quotation.merchant_id !== user.id) {
      console.warn(`[API direct-update] Authorization failed: User ${user.id} (merchant) attempted to update quotation ${quotationId} owned by merchant ${quotation.merchant_id}`);
      return NextResponse.json({ error: 'Forbidden - You do not have permission to update this quotation' }, { status: 403 });
    }

    const updateData = {
      amount: Number(amount),
      total_amount: Number(total_amount),
    };

    // Direct update (trigger is disabled, so no bypass needed)
    try {
      console.log(`[API direct-update] Updating quotation ${quotationId} directly (trigger disabled)`);
      
      const { data: updatedQuotation, error: updateError } = await supabase
        .from('quotations')
        .update(updateData)
        .eq('id', quotationId)
        .select()
        .single();
        
      if (updateError) {
        console.error(`[API direct-update] Error updating quotation:`, updateError.message);
        throw new Error('Failed to update quotation amounts');
      }
      
      console.log(`[API direct-update] Successfully updated quotation ${quotationId}`);
      return NextResponse.json(updatedQuotation, { status: 200 });
      
    } catch (directError: any) {
      console.error(`[API direct-update] Direct update failed:`, directError);
      return NextResponse.json({ error: 'Failed to update quotation', details: directError.message }, { status: 500 });
    }
  } catch (e: any) {
    console.error(`[API direct-update] Unexpected error for quotation ${quotationId}:`, e.message);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
} 