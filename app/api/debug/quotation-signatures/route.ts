import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quotationId = searchParams.get('id');
    
    if (!quotationId) {
      return NextResponse.json({ error: 'Missing quotation ID' }, { status: 400 });
    }
    
    const supabase = await getSupabaseServerClient();
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch quotation with signature fields
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select(`
        id,
        status,
        approval_signature,
        rejection_signature,
        approved_by,
        rejected_by,
        approved_at,
        rejected_at,
        approval_notes,
        rejection_reason
      `)
      .eq('id', quotationId)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    
    // Return debug info
    return NextResponse.json({
      quotation_id: quotation.id,
      status: quotation.status,
      has_approval_signature: !!quotation.approval_signature,
      has_rejection_signature: !!quotation.rejection_signature,
      approval_signature_length: quotation.approval_signature?.length || 0,
      rejection_signature_length: quotation.rejection_signature?.length || 0,
      approved_by: quotation.approved_by,
      rejected_by: quotation.rejected_by,
      approved_at: quotation.approved_at,
      rejected_at: quotation.rejected_at,
      approval_notes: quotation.approval_notes,
      rejection_reason: quotation.rejection_reason,
      signature_preview: {
        approval: quotation.approval_signature ? quotation.approval_signature.substring(0, 50) + '...' : null,
        rejection: quotation.rejection_signature ? quotation.rejection_signature.substring(0, 50) + '...' : null
      }
    });
    
  } catch (error) {
    console.error('Debug signature error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
